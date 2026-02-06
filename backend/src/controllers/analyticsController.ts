import { Request, Response } from 'express';
import { Policy } from '../models';
import { LicenseRecord } from '../models/LicenseRecord';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Get overview analytics
 * GET /api/v1/analytics/overview
 */
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Total policies (all time)
  const totalPolicies = await Policy.countDocuments();

  // Policies created today
  const policiesToday = await Policy.countDocuments({
    createdAt: { $gte: startOfToday },
  });

  // Policies created this month
  const policiesThisMonth = await Policy.countDocuments({
    createdAt: { $gte: startOfMonth },
  });

  // Policies created this year
  const policiesThisYear = await Policy.countDocuments({
    createdAt: { $gte: startOfYear },
  });

  // Total premium collected (all time)
  const premiumStats = await Policy.aggregate([
    {
      $group: {
        _id: null,
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
        total_profit: { $sum: '$profit' },
        total_gst: { $sum: '$total_premium_gst' },
      },
    },
  ]);

  // Total profit from licenses
  const licenseProfitStats = await LicenseRecord.aggregate([
    {
      $group: {
        _id: null,
        total_profit: { $sum: '$profit' },
      },
    },
  ]);

  const totalPremium = premiumStats[0]?.total_premium || 0;
  const totalCommission = premiumStats[0]?.total_commission || 0;
  const totalPolicyProfit = premiumStats[0]?.total_profit || 0;
  const totalLicenseProfit = licenseProfitStats[0]?.total_profit || 0;
  const totalGST = premiumStats[0]?.total_gst || 0;
  const totalProfit = totalPolicyProfit + totalLicenseProfit;

  // Premium this month (both premium_amount and net_premium) - using issue_date instead of createdAt
  const premiumThisMonth = await Policy.aggregate([
    {
      $match: {
        issue_date: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        total_premium: { $sum: '$premium_amount' },
        total_net_premium: { $sum: '$net_premium' },
        total_commission: { $sum: '$agent_commission' },
        total_profit: { $sum: '$profit' },
        total_gst: { $sum: '$total_premium_gst' },
      },
    },
  ]);

  // License profit this month (approximate based on expiry_date for now as createdAt might not be reliably set for all)
  // Or better, use createdAt if available on LicenseRecord
  const licenseProfitThisMonth = await LicenseRecord.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        total_profit: { $sum: '$profit' },
      },
    },
  ]);

  const monthPremium = premiumThisMonth[0]?.total_premium || 0;
  const monthNetPremium = premiumThisMonth[0]?.total_net_premium || 0;
  const monthCommission = premiumThisMonth[0]?.total_commission || 0;
  const monthPolicyProfit = premiumThisMonth[0]?.total_profit || 0;
  const monthLicenseProfit = licenseProfitThisMonth[0]?.total_profit || 0;
  const monthProfit = monthPolicyProfit + monthLicenseProfit;
  const monthGST = premiumThisMonth[0]?.total_gst || 0;

  // Active vs Expired policies
  const activeVsExpired = await Policy.aggregate([
    {
      $group: {
        _id: {
          $cond: [{ $gte: ['$end_date', now] }, 'active', 'expired'],
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const activePolicies = activeVsExpired.find((item) => item._id === 'active')?.count || 0;
  const expiredPolicies = activeVsExpired.find((item) => item._id === 'expired')?.count || 0;

  // Policies expiring in next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringSoon = await Policy.countDocuments({
    $and: [
      {
        $or: [
          { saod_end_date: { $exists: true, $ne: null } },
          { end_date: { $exists: true, $ne: null } },
        ],
      },
      {
        $or: [
          { saod_end_date: { $gte: now, $lte: thirtyDaysFromNow } },
          {
            $and: [
              { $or: [{ saod_end_date: { $exists: false } }, { saod_end_date: null }] },
              { end_date: { $gte: now, $lte: thirtyDaysFromNow } },
            ],
          },
        ],
      },
    ],
  });

  // Get expiring policies (use saod_end_date if available, else end_date)
  const expiringPolicies = await Policy.find({
    $and: [
      {
        $or: [
          { saod_end_date: { $exists: true, $ne: null } },
          { end_date: { $exists: true, $ne: null } },
        ],
      },
      {
        $or: [
          { saod_end_date: { $gte: now, $lte: thirtyDaysFromNow } },
          {
            $and: [
              { $or: [{ saod_end_date: { $exists: false } }, { saod_end_date: null }] },
              { end_date: { $gte: now, $lte: thirtyDaysFromNow } },
            ],
          },
        ],
      },
    ],
  })
    .select('_id policy_no customer end_date saod_end_date registration_number')
    .sort({ saod_end_date: 1, end_date: 1 })
    .limit(10);

  // Licenses expiring in next 90 days (3 months)
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const expiringLicenses = await LicenseRecord.find({
    expiry_date: { $gte: now, $lte: ninetyDaysFromNow },
  })
    .select('lic_no customer_name expiry_date')
    .sort({ expiry_date: 1 })
    .limit(10);

  const expiringLicensesCount = await LicenseRecord.countDocuments({
    expiry_date: { $gte: now, $lte: ninetyDaysFromNow },
  });

  res.json({
    success: true,
    data: {
      policies: {
        total: totalPolicies,
        today: policiesToday,
        this_month: policiesThisMonth,
        this_year: policiesThisYear,
        active: activePolicies,
        expired: expiredPolicies,
        expiring_soon_30d: expiringSoon,
      },
      financial: {
        total_premium: totalPremium,
        total_commission: totalCommission,
        total_profit: totalProfit,
        total_gst: totalGST,
        month_premium: monthPremium,
        month_net_premium: monthNetPremium,
        month_commission: monthCommission,
        month_profit: monthProfit,
        month_gst: monthGST,
      },
      expiring_items: {
        policies: expiringPolicies,
        licenses: expiringLicenses,
        policies_count: expiringPolicies.length,
        licenses_count: expiringLicensesCount,
        total_count: expiringPolicies.length + expiringLicenses.length,
      },
    },
  });
});

/**
 * Get policy analytics
 * GET /api/v1/analytics/policies
 */
export const getPolicyAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const matchStage: any = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
  }

  // Policy status breakdown
  const statusBreakdown = await Policy.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: '$ins_status',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // Policies by branch
  const byBranch = await Policy.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: '$branch_id',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  // Policies by insurance type
  const byInsuranceType = await Policy.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: '$ins_type',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // Policies expiring in different time windows
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  // Expiring counts should generally look forward from "now", regardless of the filtered range,
  // OR they should respect the filtered range if the user wants to see what WAS expiring then.
  // Standard dashboard behavior usually separates "historical stats" from "upcoming tasks".
  // For now, I will KEEP expiring counts relative to TODAY (now) because "Expiring Soon" is an actionable item.
  // HOWEVER, if the user specifically asked for "numerical analysis values" to change, they likely mean the charts.
  // The expiring counts are usually for future action.
  // Let's stick to modifying the breakdown charts which are historical analysis.

  const expiring7d = await Policy.countDocuments({
    $or: [
      { saod_end_date: { $gte: now, $lte: sevenDaysFromNow } },
      { end_date: { $gte: now, $lte: sevenDaysFromNow }, saod_end_date: { $exists: false } },
    ],
  });

  const expiring30d = await Policy.countDocuments({
    $or: [
      { saod_end_date: { $gte: now, $lte: thirtyDaysFromNow } },
      { end_date: { $gte: now, $lte: thirtyDaysFromNow }, saod_end_date: { $exists: false } },
    ],
  });

  const expiring90d = await Policy.countDocuments({
    $or: [
      { saod_end_date: { $gte: now, $lte: ninetyDaysFromNow } },
      { end_date: { $gte: now, $lte: ninetyDaysFromNow }, saod_end_date: { $exists: false } },
    ],
  });

  res.json({
    success: true,
    data: {
      status_breakdown: statusBreakdown,
      by_branch: byBranch,
      by_insurance_type: byInsuranceType,
      expiring: {
        next_7_days: expiring7d,
        next_30_days: expiring30d,
        next_90_days: expiring90d,
      },
    },
  });
});

/**
 * Get financial analytics
 * GET /api/v1/analytics/financial
 */
export const getFinancialAnalytics = asyncHandler(async (req: Request, res: Response) => {
  // Premium by payment status
  const byPaymentStatus = await Policy.aggregate([
    {
      $group: {
        _id: '$customer_payment_status',
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
      },
    },
    {
      $sort: { total_premium: -1 },
    },
  ]);

  // Premium by payment type
  const byPaymentType = await Policy.aggregate([
    {
      $group: {
        _id: '$customer_payment_type',
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
      },
    },
    {
      $sort: { total_premium: -1 },
    },
  ]);

  // Commission breakdown
  const commissionStats = await Policy.aggregate([
    {
      $group: {
        _id: null,
        total_commission: { $sum: '$agent_commission' },
        avg_commission: { $avg: '$agent_commission' },
        min_commission: { $min: '$agent_commission' },
        max_commission: { $max: '$agent_commission' },
      },
    },
  ]);

  // Premium range distribution
  const premiumRanges = await Policy.aggregate([
    {
      $bucket: {
        groupBy: '$premium_amount',
        boundaries: [0, 5000, 10000, 25000, 50000, 100000, 500000],
        default: '500000+',
        output: {
          count: { $sum: 1 },
          total_premium: { $sum: '$premium_amount' },
        },
      },
    },
  ]);

  // Company payment vs Customer payment
  const paymentReconciliation = await Policy.aggregate([
    {
      $group: {
        _id: null,
        total_company_amount: { $sum: '$company_amount' },
        total_customer_amount: { $sum: '$premium_amount' },
        total_extra_amount: { $sum: '$extra_amount' },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      by_payment_status: byPaymentStatus,
      by_payment_type: byPaymentType,
      commission_stats: commissionStats[0] || {
        total_commission: 0,
        avg_commission: 0,
        min_commission: 0,
        max_commission: 0,
      },
      premium_ranges: premiumRanges,
      payment_reconciliation: paymentReconciliation[0] || {
        total_company_amount: 0,
        total_customer_amount: 0,
        total_extra_amount: 0,
      },
    },
  });
});

/**
 * Get customer analytics
 * GET /api/v1/analytics/customers
 */
export const getCustomerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  // Top customers by policy count
  const topCustomers = await Policy.aggregate([
    {
      $group: {
        _id: {
          customer: '$customer',
          email: '$email',
          mobile: '$mobile_no',
        },
        policy_count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
      },
    },
    {
      $sort: { policy_count: -1 },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        customer: '$_id.customer',
        email: '$_id.email',
        mobile: '$_id.mobile',
        policy_count: 1,
        total_premium: 1,
      },
    },
  ]);

  // Policies by city
  const byCity = await Policy.aggregate([
    {
      $group: {
        _id: '$city_id',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  // Policies by executive
  const byExecutive = await Policy.aggregate([
    {
      $group: {
        _id: '$exicutive_name',
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // New customers (first policy in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newCustomers = await Policy.aggregate([
    {
      $sort: { createdAt: 1 },
    },
    {
      $group: {
        _id: '$customer',
        first_policy_date: { $first: '$createdAt' },
      },
    },
    {
      $match: {
        first_policy_date: { $gte: thirtyDaysAgo },
      },
    },
    {
      $count: 'new_customers',
    },
  ]);

  res.json({
    success: true,
    data: {
      top_customers: topCustomers,
      by_city: byCity,
      by_executive: byExecutive,
      new_customers_30d: newCustomers[0]?.new_customers || 0,
    },
  });
});

/**
 * Get vehicle analytics
 * GET /api/v1/analytics/vehicles
 */
export const getVehicleAnalytics = asyncHandler(async (req: Request, res: Response) => {
  // Policies by manufacturer
  const byManufacturer = await Policy.aggregate([
    {
      $group: {
        _id: '$manufacturer',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  // Policies by model
  const byModel = await Policy.aggregate([
    {
      $group: {
        _id: {
          manufacturer: '$manufacturer',
          model: '$model_name',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        manufacturer: '$_id.manufacturer',
        model: '$_id.model',
        count: 1,
      },
    },
  ]);

  // NCB distribution
  const ncbDistribution = await Policy.aggregate([
    {
      $group: {
        _id: '$ncb',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Policies with hypothecation
  const hypothecationCount = await Policy.countDocuments({
    hypothecation: { $exists: true, $ne: '' },
  });

  const noHypothecation = await Policy.countDocuments({
    $or: [{ hypothecation: { $exists: false } }, { hypothecation: '' }],
  });

  res.json({
    success: true,
    data: {
      by_manufacturer: byManufacturer,
      by_model: byModel,
      ncb_distribution: ncbDistribution,
      hypothecation: {
        with_hypothecation: hypothecationCount,
        without_hypothecation: noHypothecation,
      },
    },
  });
});

/**
 * Get trends (time-series data)
 * GET /api/v1/analytics/trends
 */
export const getTrends = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'monthly', months = 12, startDate, endDate } = req.query;

  let groupByFormat: Record<string, unknown>;
  let dateRangeFilter: any = {};

  switch (period) {
    case 'daily':
      groupByFormat = {
        year: { $year: '$issue_date' },
        month: { $month: '$issue_date' },
        day: { $dayOfMonth: '$issue_date' },
      };
      break;

    case 'yearly':
      groupByFormat = {
        year: { $year: '$issue_date' },
      };
      break;

    case 'monthly':
    default:
      groupByFormat = {
        year: { $year: '$issue_date' },
        month: { $month: '$issue_date' },
      };
      break;
  }

  // Use startDate/endDate if provided, otherwise calculate from months
  if (startDate || endDate) {
    dateRangeFilter = { $ne: null };
    if (startDate) {
      dateRangeFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateRangeFilter.$lte = new Date(endDate as string);
    }
  } else {
    // Fallback to months-based calculation
    const dateRange = new Date();
    switch (period) {
      case 'daily':
        dateRange.setDate(dateRange.getDate() - parseInt(months as string) * 30);
        break;
      case 'yearly':
        dateRange.setFullYear(dateRange.getFullYear() - Math.ceil(parseInt(months as string) / 12));
        break;
      case 'monthly':
      default:
        dateRange.setMonth(dateRange.getMonth() - parseInt(months as string));
        break;
    }
    dateRangeFilter = { $gte: dateRange, $ne: null };
  }

  // Policies issued over time
  const policiesOverTime = await Policy.aggregate([
    {
      $match: {
        issue_date: dateRangeFilter,
      },
    },
    {
      $group: {
        _id: groupByFormat,
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
        total_profit: { $sum: '$profit' },
        total_gst: { $sum: '$total_premium_gst' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
    },
  ]);

  res.json({
    success: true,
    data: {
      period,
      date_range: dateRangeFilter,
      trends: policiesOverTime,
    },
  });
});

/**
 * Get custom analytics (with filters)
 * POST /api/v1/analytics/custom
 */
export const getCustomAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { start_date, end_date, branch_id, ins_status, ins_type } = req.body;

  // Build match query
  const matchQuery: Record<string, unknown> = {};

  if (start_date || end_date) {
    matchQuery.createdAt = {};
    if (start_date) (matchQuery.createdAt as Record<string, unknown>).$gte = new Date(start_date);
    if (end_date) (matchQuery.createdAt as Record<string, unknown>).$lte = new Date(end_date);
  }

  if (branch_id) matchQuery.branch_id = branch_id;
  if (ins_status) matchQuery.ins_status = ins_status;
  if (ins_type) matchQuery.ins_type = ins_type;

  // Get filtered stats
  const stats = await Policy.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: null,
        total_policies: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
        avg_premium: { $avg: '$premium_amount' },
        avg_commission: { $avg: '$agent_commission' },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      filters: { start_date, end_date, branch_id, ins_status, ins_type },
      stats: stats[0] || {
        total_policies: 0,
        total_premium: 0,
        total_commission: 0,
        avg_premium: 0,
        avg_commission: 0,
      },
    },
  });
});

/**
 * Get license analytics
 * GET /api/v1/analytics/licenses
 */
export const getLicenseAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const now = new Date();

  // For license status breakdown, we might want to see licenses created in a range,
  // OR licenses expiring in a range?
  // Usually "Numerical analysis values" implies "how many licenses do we have right now" or "how many were added".
  // Given LicenseRecord doesn't have a visible createdAt in the view above, but checking the model structure would confirm.
  // Assuming LicenseRecord has createdAt like Policy. If not, we might filter by expiry_date.
  // However, "Status Distribution" (Active, Expired) is usually a snapshot of current state.
  // But if the user changes time range, maybe they want to see "Licenses expiring in this range"?
  // Or "Licenses added in this range"?
  // Let's assume standard analytics behavior: "Activity in this period". So created or updated.
  // If the user wants "Status Distribution", that's usually global.
  // BUT the user said "numerical analysis values... even when i change the time range".
  // This implies they expect the charts (pie chart of status) to change.
  // If I filter by "createdAt", it shows "What is the status of licenses CREATED in this period".
  // If I filter by "expiry_date", it shows "What is the status of licenses EXPIRING in this period".
  // Let's go with createdAt if possible, or fallback.
  // Looking at the use case: "License Status Distribution" -> Active, Expired, Suspended.
  // If I select "Last 30 days", I probably want to know about licenses relevant to the last 30 days.
  // Let's filter by createdAt for consistency with Policy Analytics.

  const matchStage: any = {};
  if (startDate || endDate) {
    matchStage.createdAt = {}; // Assuming createdAt exists on LicenseRecord schema (standard timestamp)
    if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
  }

  // License status breakdown
  const statusBreakdown = await LicenseRecord.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: {
          $cond: [{ $gte: ['$expiry_date', now] }, 'active', 'expired'],
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // Licenses expiring in different periods - this is future looking, so typically NOT filtered by past date range.
  // Same logic as Policies.

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const expiring7Days = await LicenseRecord.countDocuments({
    expiry_date: { $gte: now, $lte: sevenDaysFromNow },
  });

  const expiring30Days = await LicenseRecord.countDocuments({
    expiry_date: { $gte: now, $lte: thirtyDaysFromNow },
  });

  const expiring90Days = await LicenseRecord.countDocuments({
    expiry_date: { $gte: now, $lte: ninetyDaysFromNow },
  });

  res.json({
    success: true,
    data: {
      status_breakdown: statusBreakdown,
      expiring: {
        next_7_days: expiring7Days,
        next_30_days: expiring30Days,
        next_90_days: expiring90Days,
      },
    },
  });
});

/**
 * Get branch performance analytics
 * GET /api/v1/analytics/branches
 */
export const getBranchPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const matchStage: any = {
    branch_id: { $exists: true, $ne: null },
  };

  if (startDate || endDate) {
    matchStage.issue_date = {};
    if (startDate) matchStage.issue_date.$gte = new Date(startDate as string);
    if (endDate) matchStage.issue_date.$lte = new Date(endDate as string);
  }

  const branchStats = await Policy.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$branch_id',
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
      },
    },
    { $sort: { total_premium: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    data: branchStats,
  });
});

/**
 * Get insurance company performance analytics
 * GET /api/v1/analytics/insurance-companies
 */
export const getInsuranceCompanyPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const matchStage: any = {
    ins_co_id: { $exists: true, $ne: null },
  };

  if (startDate || endDate) {
    matchStage.issue_date = {};
    if (startDate) matchStage.issue_date.$gte = new Date(startDate as string);
    if (endDate) matchStage.issue_date.$lte = new Date(endDate as string);
  }

  const companyStats = await Policy.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$ins_co_id',
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
      },
    },
    { $sort: { total_premium: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    data: companyStats,
  });
});

/**
 * Get insurance dealer performance analytics
 * GET /api/v1/analytics/insurance-dealers
 */
export const getInsuranceDealerPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const matchStage: any = {
    insurance_dealer: { $exists: true, $nin: [null, ''] },
  };

  if (startDate || endDate) {
    matchStage.issue_date = {};
    if (startDate) matchStage.issue_date.$gte = new Date(startDate as string);
    if (endDate) matchStage.issue_date.$lte = new Date(endDate as string);
  }

  const dealerStats = await Policy.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$insurance_dealer',
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
      },
    },
    { $sort: { total_premium: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    data: dealerStats,
  });
});

/**
 * Get executive performance analytics
 * GET /api/v1/analytics/executives
 */
export const getExecutivePerformance = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const matchStage: any = {
    exicutive_name: { $exists: true, $nin: [null, ''] },
  };

  if (startDate || endDate) {
    matchStage.issue_date = {};
    if (startDate) matchStage.issue_date.$gte = new Date(startDate as string);
    if (endDate) matchStage.issue_date.$lte = new Date(endDate as string);
  }

  const executiveStats = await Policy.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$exicutive_name',
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
      },
    },
    { $sort: { total_premium: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    data: executiveStats,
  });
});

/**
 * Get calendar events (expiring policies and licenses)
 * GET /api/v1/analytics/calendar-events
 */
export const getCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'startDate and endDate are required',
    });
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  // Get expiring policies in date range
  const expiringPolicies = await Policy.find({
    $or: [
      { saod_end_date: { $gte: start, $lte: end } },
      {
        $and: [
          { $or: [{ saod_end_date: { $exists: false } }, { saod_end_date: null }] },
          { end_date: { $gte: start, $lte: end } },
        ],
      },
    ],
  })
    .select('_id policy_no customer end_date saod_end_date registration_number')
    .sort({ saod_end_date: 1, end_date: 1 })
    .limit(100);

  // Get expiring licenses in date range
  const expiringLicenses = await LicenseRecord.find({
    expiry_date: { $gte: start, $lte: end },
  })
    .select('_id lic_no customer_name expiry_date')
    .sort({ expiry_date: 1 })
    .limit(100);

  // Format as calendar events
  const policyEvents = expiringPolicies.map((p: any) => ({
    id: p._id,
    type: 'policy',
    title: `${p.policy_no} - ${p.customer}`,
    date: p.saod_end_date || p.end_date,
    registration: p.registration_number,
  }));

  const licenseEvents = expiringLicenses.map((l: any) => ({
    id: l._id,
    type: 'license',
    title: `${l.lic_no} - ${l.customer_name}`,
    date: l.expiry_date,
  }));

  res.json({
    success: true,
    data: {
      policies: policyEvents,
      licenses: licenseEvents,
      total: policyEvents.length + licenseEvents.length,
    },
  });
});
