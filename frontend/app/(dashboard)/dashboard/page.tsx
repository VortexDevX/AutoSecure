'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { usePrivacy } from '@/lib/context/PrivacyContext';
import { format } from 'date-fns';
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
import { Spinner } from '@/components/ui/Spinner';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  TruckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { DateRangePicker, DateRangeValue } from '@/components/ui/DatePicker';

type PerformanceTab = 'branch' | 'company' | 'dealer' | 'executive';

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
        return 'daily';
      case 'this_year':
      case 'last_year':
        return 'monthly';
      case 'all':
        return 'yearly';
      case 'custom':
        // Rough estimation for label/period logic
        return 'daily';
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

  const rangeLabel = getRangeLabel(selectedRange);

  // Calculate financial metrics from trends data for the selected date range
  const calculateFinancialMetrics = () => {
    if (!trends?.trends || trends.trends.length === 0) {
      return {
        rangePolicies: 0,
        rangeLicenses: 0,
        rangePremium: 0,
        rangeNetPremium: 0,
        rangeCommission: 0,
        rangeProfit: 0,
        totalPremium: overview?.financial?.total_premium || 0,
        totalCommission: overview?.financial?.total_commission || 0,
        totalProfit: overview?.financial?.total_profit || 0,
      };
    }

    const rangePremium = trends.trends.reduce((sum: number, item: any) => sum + (item.total_premium || 0), 0);
    const rangePolicies = trends.trends.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
    const rangeLicenses = licenseAnalytics?.status_breakdown?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
    const rangeCommission = trends.trends.reduce((sum: number, item: any) => sum + (item.total_commission || 0), 0);
    const rangeProfit = trends.trends.reduce((sum: number, item: any) => sum + (item.total_profit || 0), 0);
    const rangeNetPremium = trends.trends.reduce((sum: number, item: any) => sum + (item.total_net_premium || 0), 0);

    return {
      rangePolicies,
      rangeLicenses,
      rangePremium,
      rangeNetPremium,
      rangeCommission,
      rangeProfit,
      totalPremium: overview?.financial?.total_premium || 0,
      totalCommission: overview?.financial?.total_commission || 0,
      totalProfit: overview?.financial?.total_profit || 0,
    };
  };

  const financialMetrics = calculateFinancialMetrics();

  const performanceTabs = [
    { id: 'company' as const, label: 'Ins. Company', icon: ChartBarIcon },
    { id: 'branch' as const, label: 'Branch', icon: BuildingOfficeIcon },
    { id: 'dealer' as const, label: 'Ins. Dealer', icon: TruckIcon },
    { id: 'executive' as const, label: 'Executive', icon: UserGroupIcon },
  ];

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

  const getPerformanceTitle = () => {
    switch (activePerformanceTab) {
      case 'branch':
        return 'Branch Performance';
      case 'company':
        return 'Insurance Company Performance';
      case 'dealer':
        return 'Insurance Dealer Performance';
      case 'executive':
        return 'Executive Performance';
      default:
        return 'Performance';
    }
  };

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
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.full_name || user?.email?.split('@')[0]}! Here's your business
                overview.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-2">
                <DateRangeSelector
                  selectedRange={selectedRange}
                  onRangeChange={updateDateRange}
                  className="w-48"
                />
                {selectedRange === 'custom' && (
                  <div className="flex items-center gap-2">
                    <DateRangePicker
                      value={customRange}
                      onChange={(range) => range && setCustomRange(range)}
                      className="w-64"
                      showPresets={false}
                    />
                  </div>
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
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActionsPanel />
        </div>

        {/* Financial Overview */}
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Financial Overview</h2>
                <p className="text-sm text-gray-500">{rangeLabel}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="card p-5 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Policies</p>
                  <ChartBarIcon className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">{financialMetrics.rangePolicies}</p>
                <div className="flex items-center mt-1">
                  <span className="text-slate-400 text-[10px]">In selected period</span>
                </div>
              </div>

              <div className="card p-5 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Licenses</p>
                  <BuildingOfficeIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {financialMetrics.rangeLicenses}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-slate-400 text-[10px]">In selected period</span>
                </div>
              </div>

              <div className="card p-5 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Expiring</p>
                  <ChartBarIcon className="w-5 h-5 text-rose-500" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {overview?.expiring_items?.total_count || 0}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-slate-400 text-[10px]">Policies & Licenses</span>
                </div>
              </div>

              <div className="card p-5 flex border-t-4 border-indigo-500 flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Net Premium</p>
                  <ChartBarIcon className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {formatPrivacyValue(
                    financialMetrics.rangeNetPremium >= 10000000
                      ? `₹${(financialMetrics.rangeNetPremium / 10000000).toFixed(1)}Cr`
                      : financialMetrics.rangeNetPremium >= 100000
                        ? `₹${(financialMetrics.rangeNetPremium / 100000).toFixed(1)}L`
                        : financialMetrics.rangeNetPremium >= 1000
                          ? `₹${(financialMetrics.rangeNetPremium / 1000).toFixed(0)}K`
                          : `₹${financialMetrics.rangeNetPremium.toLocaleString('en-IN')}`
                  )}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-slate-400 text-[10px]">{rangeLabel}</span>
                </div>
              </div>

              <div className="card p-5 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Commission</p>
                  <ChartBarIcon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {formatPrivacyValue(
                    financialMetrics.rangeCommission >= 10000000
                      ? `₹${(financialMetrics.rangeCommission / 10000000).toFixed(1)}Cr`
                      : financialMetrics.rangeCommission >= 100000
                        ? `₹${(financialMetrics.rangeCommission / 100000).toFixed(1)}L`
                        : financialMetrics.rangeCommission >= 1000
                          ? `₹${(financialMetrics.rangeCommission / 1000).toFixed(0)}K`
                          : `₹${financialMetrics.rangeCommission.toLocaleString('en-IN')}`
                  )}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-slate-400 text-[10px]">{rangeLabel}</span>
                </div>
              </div>

              <div className="card p-5 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Profit</p>
                  <ChartBarIcon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {formatPrivacyValue(
                    financialMetrics.rangeProfit >= 10000000
                      ? `₹${(financialMetrics.rangeProfit / 10000000).toFixed(1)}Cr`
                      : financialMetrics.rangeProfit >= 100000
                        ? `₹${(financialMetrics.rangeProfit / 100000).toFixed(1)}L`
                        : financialMetrics.rangeProfit >= 1000
                          ? `₹${(financialMetrics.rangeProfit / 1000).toFixed(0)}K`
                          : `₹${financialMetrics.rangeProfit.toLocaleString('en-IN')}`
                  )}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-slate-400 text-[10px]">{rangeLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart - Full Width */}
        <div className="mb-8">
          <RevenueTrendChart data={trends?.trends || null} period={getPeriodFromRange(selectedRange)} />
        </div>

        {/* Performance Breakdown Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Performance Breakdown</h2>
            <p className="text-gray-600">
              Compare performance across different dimensions for {rangeLabel.toLowerCase()}
            </p>
          </div>

          {/* Performance Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                {performanceTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePerformanceTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activePerformanceTab === tab.id
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-6">
              <PerformanceChart
                title={getPerformanceTitle()}
                subtitle={`Premium collected by ${activePerformanceTab} for ${rangeLabel.toLowerCase()}`}
                data={getActivePerformanceData()}
                isLoading={isLoading}
                emptyMessage={`No ${activePerformanceTab} data available for this period`}
              />
            </div>
          </div>
        </div>

        {/* Analytics Charts + Calendar */}
        <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Policy/License Charts */}
          <div className="xl:col-span-2 space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Policy & License Analytics</h2>
              <p className="text-gray-600 text-sm">Status and type distribution</p>
            </div>

            {/* Status Chart - Full Width */}
            {policyAnalytics?.status_breakdown && policyAnalytics.status_breakdown.length > 0 && (
              <PoliciesByStatusChart data={policyAnalytics.status_breakdown} />
            )}

            {/* Side-by-Side Pie Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policyAnalytics?.by_insurance_type &&
                policyAnalytics.by_insurance_type.length > 0 && (
                  <PoliciesByTypeChart data={policyAnalytics.by_insurance_type} />
                )}
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

          {/* Right Column - Calendar (Narrower 1/3 width) */}
          <div className="xl:col-span-1">
            <RenewalCalendar
              policies={calendarEvents?.policies || []}
              licenses={calendarEvents?.licenses || []}
              isLoading={!calendarEvents}
            />
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
