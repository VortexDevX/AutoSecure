import { Request, Response } from 'express';
import { Policy } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';

/**
 * Get overview analytics
 * GET /api/v1/analytics/overview
 */
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
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
      },
    },
  ]);

  const totalPremium = premiumStats[0]?.total_premium || 0;
  const totalCommission = premiumStats[0]?.total_commission || 0;

  // Premium this month
  const premiumThisMonth = await Policy.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
      },
    },
  ]);

  const monthPremium = premiumThisMonth[0]?.total_premium || 0;
  const monthCommission = premiumThisMonth[0]?.total_commission || 0;

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
    end_date: {
      $gte: now,
      $lte: thirtyDaysFromNow,
    },
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
        month_premium: monthPremium,
        month_commission: monthCommission,
      },
    },
  });
});

/**
 * Get policy analytics
 * GET /api/v1/analytics/policies
 */
export const getPolicyAnalytics = asyncHandler(async (req: Request, res: Response) => {
  // Policy status breakdown
  const statusBreakdown = await Policy.aggregate([
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

  const expiring7d = await Policy.countDocuments({
    end_date: { $gte: now, $lte: sevenDaysFromNow },
  });

  const expiring30d = await Policy.countDocuments({
    end_date: { $gte: now, $lte: thirtyDaysFromNow },
  });

  const expiring90d = await Policy.countDocuments({
    end_date: { $gte: now, $lte: ninetyDaysFromNow },
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

  // Krunal payment vs Customer payment
  const paymentReconciliation = await Policy.aggregate([
    {
      $group: {
        _id: null,
        total_krunal_amount: { $sum: '$krunal_amount' },
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
        total_krunal_amount: 0,
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
  const { period = 'monthly', months = 12 } = req.query;

  let groupByFormat: any;
  let dateRange: Date;

  switch (period) {
    case 'daily':
      groupByFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
      dateRange = new Date();
      dateRange.setDate(dateRange.getDate() - 30); // Last 30 days
      break;

    case 'yearly':
      groupByFormat = {
        year: { $year: '$createdAt' },
      };
      dateRange = new Date();
      dateRange.setFullYear(dateRange.getFullYear() - 5); // Last 5 years
      break;

    case 'monthly':
    default:
      groupByFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
      dateRange = new Date();
      dateRange.setMonth(dateRange.getMonth() - parseInt(months as string));
      break;
  }

  // Policies created over time
  const policiesOverTime = await Policy.aggregate([
    {
      $match: {
        createdAt: { $gte: dateRange },
      },
    },
    {
      $group: {
        _id: groupByFormat,
        count: { $sum: 1 },
        total_premium: { $sum: '$premium_amount' },
        total_commission: { $sum: '$agent_commission' },
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
      date_range: dateRange,
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
  const matchQuery: any = {};

  if (start_date || end_date) {
    matchQuery.createdAt = {};
    if (start_date) matchQuery.createdAt.$gte = new Date(start_date);
    if (end_date) matchQuery.createdAt.$lte = new Date(end_date);
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
