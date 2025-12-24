'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FinancialMetrics } from '@/components/dashboard/FinancialMetrics';
import { PoliciesByTypeChart } from '@/components/dashboard/PoliciesByTypeChart';
import { PoliciesByStatusChart } from '@/components/dashboard/PoliciesByStatusChart';
import { LicenseAnalytics } from '@/components/dashboard/LicenseAnalytics';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DateRangePreset, DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
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
  const {
    overview,
    policyAnalytics,
    licenseAnalytics,
    trends,
    isLoading,
    error,
    dateRange,
    updateDateRange,
  } = useAnalytics();

  const getPeriodFromRange = (range: DateRangePreset): 'daily' | 'monthly' | 'yearly' => {
    switch (range) {
      case '7d':
      case '30d':
        return 'daily';
      case '1y':
      case 'all':
        return 'yearly';
      default:
        return 'monthly';
    }
  };

  const getRangeLabel = (range: DateRangePreset): string => {
    switch (range) {
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '3m':
        return 'Last 3 Months';
      case '6m':
        return 'Last 6 Months';
      case '1y':
        return 'Last Year';
      case 'all':
        return 'All Time';
      default:
        return 'Selected Period';
    }
  };

  const period = getPeriodFromRange(dateRange);
  const rangeLabel = getRangeLabel(dateRange);

  // Calculate financial metrics from trends data for the selected date range
  const calculateFinancialMetrics = () => {
    if (!trends?.trends || trends.trends.length === 0) {
      return {
        rangePremium: 0,
        rangeCommission: 0,
        totalPremium: overview?.financial?.total_premium || 0,
        totalCommission: overview?.financial?.total_commission || 0,
      };
    }

    const rangePremium = trends.trends.reduce((sum, item) => sum + item.total_premium, 0);
    const rangeCommission = trends.trends.reduce((sum, item) => sum + item.total_commission, 0);

    return {
      rangePremium,
      rangeCommission,
      totalPremium: overview?.financial?.total_premium || 0,
      totalCommission: overview?.financial?.total_commission || 0,
    };
  };

  const financialMetrics = calculateFinancialMetrics();

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
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.full_name || user?.email?.split('@')[0]}! Here's your business
                overview.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <DateRangeSelector
                selectedRange={dateRange}
                onRangeChange={updateDateRange}
                className="w-48"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Overview */}
        {overview?.financial && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
              <p className="text-gray-600">
                Revenue and commission metrics for selected time period
              </p>
            </div>
            <FinancialMetrics
              totalPremium={financialMetrics.totalPremium}
              totalCommission={financialMetrics.totalCommission}
              rangePremium={financialMetrics.rangePremium}
              rangeCommission={financialMetrics.rangeCommission}
              rangeLabel={rangeLabel}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Policies"
            value={overview?.policies.total || 0}
            subtitle={`${overview?.policies.active || 0} active`}
            icon={<DocumentTextIcon className="w-6 h-6" />}
            color="blue"
          />
          <MetricCard
            title="Total Licenses"
            value={
              licenseAnalytics
                ? licenseAnalytics.status_breakdown?.reduce(
                    (sum: number, item: any) => sum + item.count,
                    0
                  ) || 0
                : 0
            }
            subtitle={`${
              licenseAnalytics?.status_breakdown?.find((item: any) => item._id === 'active')
                ?.count || 0
            } active`}
            icon={<IdentificationIcon className="w-6 h-6" />}
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
        </div>

        {/* Expiring Items Alert */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Items Expiring Soon</h3>
                  <p className="text-gray-600">Policies and licenses requiring attention</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {overview?.expiring_items?.total_count || 0}
                </div>
                <div className="text-sm text-gray-600">total items</div>
              </div>
            </div>
            <ExpiringItemsList />
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
            <p className="text-gray-600">Performance metrics and trends</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Policy Analytics */}
            <div className="space-y-4">
              {policyAnalytics?.status_breakdown && policyAnalytics.status_breakdown.length > 0 && (
                <PoliciesByStatusChart data={policyAnalytics.status_breakdown} />
              )}
              {policyAnalytics?.by_insurance_type &&
                policyAnalytics.by_insurance_type.length > 0 && (
                  <PoliciesByTypeChart data={policyAnalytics.by_insurance_type} />
                )}
            </div>

            {/* License Analytics */}
            <div className="space-y-4">
              {licenseAnalytics?.status_breakdown &&
                licenseAnalytics.status_breakdown.length > 0 && (
                  <LicenseAnalytics
                    statusBreakdown={licenseAnalytics.status_breakdown}
                    totalLicenses={licenseAnalytics.status_breakdown.reduce(
                      (sum: number, item: any) => sum + item.count,
                      0
                    )}
                  />
                )}
            </div>
          </div>
        </div>

        {/* Recent Activity - Full Width at Bottom */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
