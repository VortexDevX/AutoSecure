frontend/app/(dashboard)/dashboard/page.tsx:-

```
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PoliciesByTypeChart } from '@/components/dashboard/PoliciesByTypeChart';
import { PoliciesByStatusChart } from '@/components/dashboard/PoliciesByStatusChart';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

interface ExpiringPolicy {
  _id: string;
  policy_no: string;
  customer: string;
  saod_end_date?: string;
  end_date: string;
  registration_number: string;
}

interface ExpiringLicense {
  _id: string;
  lic_no: string;
  customer_name: string;
  expiry_date: string;
}

function ExpiringItemsList() {
  const { overview } = useAnalytics();

  if (!overview?.expiring_items || overview.expiring_items.total_count === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No items expiring soon</p>;
  }

  return (
    <div className="space-y-6">
      {/* Expiring Policies (30 days) */}
      {overview.expiring_items.policies?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-yellow-600" />
              Policies Expiring (30 days)
            </h4>
            <span className="text-xs text-gray-500">
              {overview.expiring_items.policies_count} total
            </span>
          </div>
          <div className="space-y-2">
            {overview.expiring_items.policies.slice(0, 5).map((policy: ExpiringPolicy) => (
              <div
                key={policy._id}
                className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {policy.policy_no} - {policy.customer}
                  </p>
                  <p className="text-xs text-gray-600">{policy.registration_number}</p>
                  <p className="text-xs text-yellow-700 font-medium">
                    Expires: {formatDate(policy.saod_end_date || policy.end_date)}
                  </p>
                </div>
                <Link
                  href={`/policies/${policy._id}`}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
          {overview.expiring_items.policies_count > 5 && (
            <Link
              href="/policies?expiring_soon=true"
              className="block text-center text-sm text-primary hover:underline mt-2"
            >
              View all {overview.expiring_items.policies_count} policies →
            </Link>
          )}
        </div>
      )}

      {/* Expiring Licenses (90 days / 3 months) */}
      {overview.expiring_items.licenses?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <IdentificationIcon className="w-4 h-4 text-orange-600" />
              Licenses Expiring (3 months)
            </h4>
            <span className="text-xs text-gray-500">
              {overview.expiring_items.licenses_count} total
            </span>
          </div>
          <div className="space-y-2">
            {overview.expiring_items.licenses.slice(0, 5).map((license: ExpiringLicense) => (
              <div
                key={license._id}
                className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <IdentificationIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {license.lic_no} - {license.customer_name}
                  </p>
                  <p className="text-xs text-orange-700 font-medium">
                    Expires: {formatDate(license.expiry_date)}
                  </p>
                </div>
                <Link
                  href={`/licenses/${license._id}`}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
          {overview.expiring_items.licenses_count > 5 && (
            <Link
              href="/licenses?expiring_soon=true"
              className="block text-center text-sm text-primary hover:underline mt-2"
            >
              View all {overview.expiring_items.licenses_count} licenses →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { overview, policyAnalytics, trends, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">Failed to load analytics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.full_name || user?.email?.split('@')[0]}! Here's an overview of your
          insurance policies and licenses.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Policies"
          value={overview?.policies.total || 0}
          subtitle={`${overview?.policies.active || 0} active`}
          icon={<DocumentTextIcon className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Created Today"
          value={overview?.policies.today || 0}
          subtitle="New policies"
          icon={<PlusIcon className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Expiring Soon"
          value={overview?.expiring_items?.total_count || 0}
          subtitle="Policies & Licenses"
          icon={<ClockIcon className="w-6 h-6" />}
          color="yellow"
        />
        <MetricCard
          title="This Month"
          value={overview?.policies.this_month || 0}
          subtitle="policies created"
          icon={<DocumentDuplicateIcon className="w-6 h-6" />}
          color="gray"
        />
      </div>

      {/* Expiring Items Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">⚠️ Expiring Soon</h2>
        </div>
        <ExpiringItemsList />
      </div>

      {/* Quick Actions & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div>
          {policyAnalytics?.by_insurance_type && policyAnalytics.by_insurance_type.length > 0 && (
            <PoliciesByTypeChart data={policyAnalytics.by_insurance_type} />
          )}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {policyAnalytics?.status_breakdown && policyAnalytics.status_breakdown.length > 0 && (
            <PoliciesByStatusChart data={policyAnalytics.status_breakdown} />
          )}
          <MonthlyTrendChart data={trends} />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
```

frontend/lib/api/policies.ts:-

```
import apiClient from './client';
import { Policy } from '@/lib/types/policy';

export interface PolicyResponse {
  status: string;
  data: {
    policy: Policy;
  };
}

export interface PoliciesResponse {
  status: string;
  data: {
    policies: Policy[]; // This should be the full Policy type, not PolicyListItem
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

/**
 * Get single policy by ID
 */
export const getPolicyById = async (id: string): Promise<Policy> => {
  const response = await apiClient.get<PolicyResponse>(`/api/v1/policies/${id}`);
  return response.data.data.policy;
};

/**
 * Create new policy
 */
export const createPolicy = async (formData: FormData): Promise<Policy> => {
  const response = await apiClient.post<PolicyResponse>('/api/v1/policies', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.policy;
};

/**
 * Update existing policy
 */
export const updatePolicy = async (id: string, formData: FormData): Promise<Policy> => {
  const response = await apiClient.patch<PolicyResponse>(`/api/v1/policies/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.policy;
};

/**
 * Delete policy
 */
export const deletePolicy = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/policies/${id}`);
};

/**
 * Get signed URL for a file (from R2)
 */
export const getFileSignedUrl = async (
  policyNo: string,
  fileName: string,
  download: boolean = false
): Promise<string> => {
  const response = await apiClient.get<{
    status: string;
    data: { url: string; expires_in: number };
  }>(`/api/v1/files/${policyNo}/${fileName}/url`, {
    params: { download: download ? 'true' : 'false' },
  });
  return response.data.data.url;
};

/**
 * Get file as blob (fetches from R2 signed URL)
 */
export const getFileBlob = async (policyNo: string, fileName: string): Promise<Blob> => {
  // Get signed URL from backend
  const signedUrl = await getFileSignedUrl(policyNo, fileName, false);

  // Fetch file directly from R2
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  return response.blob();
};

/**
 * View file in new tab (opens R2 signed URL directly)
 */
export const viewFile = async (policyNo: string, fileName: string): Promise<void> => {
  try {
    // Get signed URL from backend
    const signedUrl = await getFileSignedUrl(policyNo, fileName, false);

    // Open signed URL in new tab
    window.open(signedUrl, '_blank');
  } catch (error) {
    console.error('Failed to view file:', error);
    throw error;
  }
};

/**
 * Download file (uses R2 signed URL with download disposition)
 */
export const downloadFile = async (
  policyNo: string,
  fileName: string,
  downloadName?: string
): Promise<void> => {
  try {
    // Get signed URL with download disposition
    const signedUrl = await getFileSignedUrl(policyNo, fileName, true);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = downloadName || fileName;
    link.target = '_blank'; // Fallback for browsers that don't support download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw error;
  }
};

/**
 * Delete a specific file from a policy
 */
export const deletePolicyFile = async (
  policyId: string,
  fileType: 'adh_file' | 'pan_file' | 'other_document',
  fileIndex?: number
): Promise<Policy> => {
  const response = await apiClient.delete<PolicyResponse>(
    `/api/v1/policies/${policyId}/files/${fileType}${fileIndex !== undefined ? `/${fileIndex}` : ''}`
  );
  return response.data.data.policy;
};
```

frontend/lib/api/analytics.ts:-

```
import apiClient, { getErrorMessage } from './client';
import { ApiResponse } from '../types/api';

export interface ExpiringItem {
  _id: string;
  policy_no: string;
  customer: string;
  saod_end_date?: string;
  end_date: string;
  registration_number: string;
}

export interface ExpiringLicense {
  _id: string;
  lic_no: string;
  customer_name: string;
  expiry_date: string;
}

export interface ExpiringItems {
  policies: ExpiringItem[];
  licenses: ExpiringLicense[];
  policies_count: number;
  licenses_count: number;
  total_count: number;
}

export interface OverviewAnalytics {
  policies: {
    total: number;
    today: number;
    this_month: number;
    this_year: number;
    active: number;
    expired: number;
    expiring_soon_30d: number;
  };
  financial: {
    total_premium: number;
    total_commission: number;
    month_premium: number;
    month_commission: number;
  };
  expiring_items: ExpiringItems;
}

export interface PolicyAnalytics {
  status_breakdown: Array<{ _id: string; count: number }>;
  by_branch: Array<{ _id: string; count: number }>;
  by_insurance_type: Array<{ _id: string; count: number }>;
  expiring: {
    next_7_days: number;
    next_30_days: number;
    next_90_days: number;
  };
}

export interface TrendData {
  period: string;
  date_range: string;
  trends: Array<{
    _id: { year: number; month: number; day?: number };
    count: number;
    total_premium: number;
    total_commission: number;
  }>;
}

export const analyticsApi = {
  /**
   * Get overview analytics
   */
  async getOverview(): Promise<OverviewAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<OverviewAnalytics>>(
        '/api/v1/analytics/overview'
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get policy analytics
   */
  async getPolicyAnalytics(): Promise<PolicyAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<PolicyAnalytics>>(
        '/api/v1/analytics/policies'
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get trends
   */
  async getTrends(
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    months: number = 6
  ): Promise<TrendData> {
    try {
      const response = await apiClient.get<ApiResponse<TrendData>>(
        `/api/v1/analytics/trends?period=${period}&months=${months}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
```

backend/src/controllers/analyticsController.ts:-

```
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
    $or: [
      { saod_end_date: { $gte: now, $lte: thirtyDaysFromNow } },
      { end_date: { $gte: now, $lte: thirtyDaysFromNow }, saod_end_date: { $exists: false } },
    ],
  });

  // Get expiring policies (use saod_end_date if available, else end_date)
  const expiringPolicies = await Policy.find({
    $or: [
      { saod_end_date: { $gte: now, $lte: thirtyDaysFromNow } },
      { end_date: { $gte: now, $lte: thirtyDaysFromNow }, saod_end_date: { $exists: false } },
    ],
  })
    .select('policy_no customer end_date saod_end_date registration_number')
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
        month_premium: monthPremium,
        month_commission: monthCommission,
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
  const { period = 'monthly', months = 12 } = req.query;

  let groupByFormat: Record<string, unknown>;
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
```

backend/src/routes/analyticsRoutes.ts:-

```
import { Router } from 'express';
import {
  getOverview,
  getPolicyAnalytics,
  getFinancialAnalytics,
  getCustomerAnalytics,
  getVehicleAnalytics,
  getTrends,
  getCustomAnalytics,
} from '../controllers/analyticsController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/policies', getPolicyAnalytics);
router.get('/financial', getFinancialAnalytics);
router.get('/customers', getCustomerAnalytics);
router.get('/vehicles', getVehicleAnalytics);
router.get('/trends', getTrends);
router.post('/custom', getCustomAnalytics);

export default router;
```

expiring soon license is working and it's url too
