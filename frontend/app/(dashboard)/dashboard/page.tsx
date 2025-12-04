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
