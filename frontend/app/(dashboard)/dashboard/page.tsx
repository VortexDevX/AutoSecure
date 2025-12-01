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
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

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
          Welcome back, {user?.full_name || user?.email.split('@')[0]}! Here's an overview of your
          insurance policies.
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
          value={overview?.policies.expiring_soon_30d || 0}
          subtitle="in next 30 days"
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

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Warnings & Alerts</h3>
          {overview && overview.policies.expiring_soon_30d > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 mt-0.5">⚠️</span>
                <p className="text-sm text-gray-700">
                  {overview.policies.expiring_soon_30d}{' '}
                  {overview.policies.expiring_soon_30d === 1 ? 'policy' : 'policies'} expiring in
                  the next 30 days.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No warnings at this time</p>
          )}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {policyAnalytics?.by_insurance_type && policyAnalytics.by_insurance_type.length > 0 && (
            <PoliciesByTypeChart data={policyAnalytics.by_insurance_type} />
          )}
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
