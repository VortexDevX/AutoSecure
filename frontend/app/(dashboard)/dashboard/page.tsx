'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { usePrivacy } from '@/lib/context/PrivacyContext';
import { PoliciesByTypeChart } from '@/components/dashboard/PoliciesByTypeChart';
// @ts-ignore
import { PoliciesByStatusChart } from '@/components/dashboard/PoliciesByStatusChart';
import { LicenseAnalytics } from '@/components/dashboard/LicenseAnalytics';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { RenewalCalendar } from '@/components/dashboard/RenewalCalendar';
import { NotificationsCenter } from '@/components/dashboard/NotificationsCenter';
import { RevenueTrendChart } from '@/components/dashboard/RevenueTrendChart';
import { DateRangePreset, DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { DateRangePicker } from '@/components/ui/DatePicker';
import { Spinner } from '@/components/ui/Spinner';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  TruckIcon,
  UserGroupIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type PerformanceTab = 'branch' | 'company' | 'dealer' | 'executive';

const performanceTabs = [
  { id: 'company' as const, label: 'Ins. Company', icon: ChartBarIcon },
  { id: 'branch' as const, label: 'Branch', icon: BuildingOfficeIcon },
  { id: 'dealer' as const, label: 'Ins. Dealer', icon: TruckIcon },
  { id: 'executive' as const, label: 'Executive', icon: UserGroupIcon },
];

const formatCompactINR = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { formatPrivacyValue } = usePrivacy();
  const {
    overview,
    policyAnalytics,
    licenseAnalytics,
    trends,
    branchPerformance,
    companyPerformance,
    dealerPerformance,
    executivePerformance,
    calendarEvents,
    isLoading,
    error,
    dateRange: selectedRange,
    customRange,
    setCustomRange,
    updateDateRange,
  } = useAnalytics();

  const [activePerformanceTab, setActivePerformanceTab] = useState<PerformanceTab>('branch');

  const getPeriodFromRange = (range: DateRangePreset): 'daily' | 'monthly' | 'yearly' => {
    switch (range) {
      case '7d':
      case 'this_month':
      case 'last_month':
      case 'custom':
        return 'daily';
      case 'this_year':
      case 'last_year':
        return 'monthly';
      case 'all':
        return 'yearly';
      default:
        return 'monthly';
    }
  };

  const getRangeLabel = (range: DateRangePreset): string => {
    if (range === 'custom' && customRange.from) {
      const fromStr = format(customRange.from, 'MMM d, yyyy');
      const toStr = customRange.to ? format(customRange.to, 'MMM d, yyyy') : fromStr;
      return `${fromStr} - ${toStr}`;
    }

    switch (range) {
      case '7d':
        return 'Last 7 Days';
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'this_year':
        return 'This Year';
      case 'last_year':
        return 'Last Year';
      case 'all':
        return 'All Time';
      default:
        return 'Selected Period';
    }
  };

  const getActivePerformanceData = () => {
    switch (activePerformanceTab) {
      case 'branch':
        return branchPerformance || [];
      case 'company':
        return companyPerformance || [];
      case 'dealer':
        return dealerPerformance || [];
      case 'executive':
        return executivePerformance || [];
      default:
        return [];
    }
  };

  const rangeLabel = getRangeLabel(selectedRange);

  const metrics = !trends?.trends?.length
    ? {
        rangePolicies: 0,
        rangeLicenses: 0,
        rangeNetPremium: 0,
        rangeCommission: 0,
        rangeProfit: 0,
      }
    : {
        rangePolicies: trends.trends.reduce((sum: number, item: any) => sum + (item.count || 0), 0),
        rangeLicenses:
          licenseAnalytics?.status_breakdown?.reduce((sum: number, item: any) => sum + item.count, 0) ||
          0,
        rangeNetPremium: trends.trends.reduce(
          (sum: number, item: any) => sum + (item.total_net_premium || 0),
          0
        ),
        rangeCommission: trends.trends.reduce(
          (sum: number, item: any) => sum + (item.total_commission || 0),
          0
        ),
        rangeProfit: trends.trends.reduce((sum: number, item: any) => sum + (item.total_profit || 0), 0),
      };

  const compactCards = [
    {
      label: 'Policies',
      value: metrics.rangePolicies,
      note: 'In range',
      icon: SparklesIcon,
      iconClass: 'bg-sky-100/80 text-sky-700',
    },
    {
      label: 'Licenses',
      value: metrics.rangeLicenses,
      note: 'Tracked',
      icon: ShieldCheckIcon,
      iconClass: 'bg-cyan-100/80 text-cyan-700',
    },
    {
      label: 'Expiring',
      value: overview?.expiring_items?.total_count || 0,
      note: 'Live reminders',
      icon: ArrowTrendingUpIcon,
      iconClass: 'bg-amber-100/80 text-amber-700',
    },
    {
      label: 'Net Premium',
      value: formatCompactINR(metrics.rangeNetPremium),
      note: rangeLabel,
      icon: BanknotesIcon,
      iconClass: 'bg-blue-100/80 text-blue-700',
    },
    {
      label: 'Commission',
      value: formatPrivacyValue(formatCompactINR(metrics.rangeCommission)),
      note: rangeLabel,
      icon: ChartBarIcon,
      iconClass: 'bg-slate-200/85 text-slate-700',
    },
    {
      label: 'Profit',
      value: formatPrivacyValue(formatCompactINR(metrics.rangeProfit)),
      note: rangeLabel,
      icon: BuildingOfficeIcon,
      iconClass: 'bg-teal-100/80 text-teal-700',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-[24px] p-8 text-rose-900">
        <p className="text-lg font-semibold">Failed to load analytics</p>
        <p className="mt-1 text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative z-30 glass-panel-strong rounded-[24px] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="section-label">Operations Overview</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Welcome back, {user?.full_name || user?.email?.split('@')[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track premium, renewals, and recent performance in one view.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-2">
              <DateRangeSelector
                selectedRange={selectedRange}
                onRangeChange={updateDateRange}
                className="w-full sm:w-44"
              />
              {selectedRange === 'custom' && (
                <DateRangePicker
                  value={customRange}
                  onChange={(range) => range && setCustomRange(range)}
                  className="w-full sm:w-60"
                  showPresets={false}
                />
              )}
            </div>
            <NotificationsCenter
              expiringPolicies={overview?.expiring_items?.policies || []}
              expiringLicenses={overview?.expiring_items?.licenses || []}
              policiesCount={overview?.expiring_items?.policies_count || 0}
              licensesCount={overview?.expiring_items?.licenses_count || 0}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,0.95fr)]">
        <div className="glass-panel rounded-[24px] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/45 pb-4">
            <div>
              <p className="section-label">Summary</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
                Snapshot for {rangeLabel.toLowerCase()}
              </h2>
            </div>
            <div className="rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              6 metrics
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {compactCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-[18px] border border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                    </div>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] ${item.iconClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <QuickActionsPanel />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(20rem,0.92fr)]">
        <div className="glass-panel min-w-0 rounded-[24px] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Revenue Flow</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
                Trendline for {rangeLabel.toLowerCase()}
              </h2>
            </div>
          </div>
          <RevenueTrendChart data={trends?.trends || null} period={getPeriodFromRange(selectedRange)} />
        </div>

        <RenewalCalendar
          policies={calendarEvents?.policies || []}
          licenses={calendarEvents?.licenses || []}
          isLoading={!calendarEvents}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]">
        <section className="glass-panel min-w-0 overflow-hidden rounded-[24px]">
          <div className="border-b border-white/45 px-4 py-4">
            <p className="section-label">Performance Matrix</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
              Breakdown by operating dimension
            </h2>
          </div>
          <div className="px-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {performanceTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activePerformanceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePerformanceTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50/90 text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4">
            <PerformanceChart
              title="Performance"
              subtitle={`Premium collected by ${activePerformanceTab} for ${rangeLabel.toLowerCase()}`}
              data={getActivePerformanceData()}
              isLoading={isLoading}
              emptyMessage={`No ${activePerformanceTab} data available for this period`}
            />
          </div>
        </section>

        <section className="glass-panel min-w-0 overflow-hidden rounded-[24px]">
          <div className="border-b border-white/45 px-4 py-4">
            <p className="section-label">Activity Feed</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
              Recent activity
            </h2>
          </div>
          <RecentActivity />
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="glass-panel min-w-0 rounded-[24px] p-4">
          <p className="section-label">Policy Signals</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-900">
            Status view
          </h3>
          <div className="mt-4">
            {policyAnalytics?.status_breakdown && policyAnalytics.status_breakdown.length > 0 ? (
              <PoliciesByStatusChart data={policyAnalytics.status_breakdown} />
            ) : (
              <div className="rounded-[16px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No policy status data for the selected period.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel min-w-0 rounded-[24px] p-4">
          <p className="section-label">Policy Mix</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-900">
            Insurance type spread
          </h3>
          <div className="mt-4">
            {policyAnalytics?.by_insurance_type && policyAnalytics.by_insurance_type.length > 0 ? (
              <PoliciesByTypeChart data={policyAnalytics.by_insurance_type} />
            ) : (
              <div className="rounded-[16px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No policy type data for the selected period.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel min-w-0 rounded-[24px] p-4">
          <p className="section-label">License Status</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-900">
            License analytics
          </h3>
          <div className="mt-4">
            {licenseAnalytics?.status_breakdown && licenseAnalytics.status_breakdown.length > 0 ? (
              <LicenseAnalytics
                statusBreakdown={licenseAnalytics.status_breakdown}
                totalLicenses={licenseAnalytics.status_breakdown.reduce(
                  (sum: number, item: any) => sum + item.count,
                  0
                )}
              />
            ) : (
              <div className="rounded-[16px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No license status data for the selected period.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
