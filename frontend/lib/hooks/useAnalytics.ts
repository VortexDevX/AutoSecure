import { useState, useEffect, useCallback } from 'react';
import { analyticsApi, OverviewAnalytics, PolicyAnalytics, TrendData } from '../api/analytics';
import { DateRangePreset } from '@/components/ui/DateRangeSelector';

export function useAnalytics() {
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [policyAnalytics, setPolicyAnalytics] = useState<PolicyAnalytics | null>(null);
  const [licenseAnalytics, setLicenseAnalytics] = useState<any | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePreset>('3m');

  const getMonthsFromRange = (range: DateRangePreset): number => {
    switch (range) {
      case '7d':
        return 1; // Will use daily period
      case '30d':
        return 1; // Will use daily period
      case '3m':
        return 3;
      case '6m':
        return 6;
      case '1y':
        return 12;
      case 'all':
        return 60; // 5 years
      default:
        return 6;
    }
  };

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

  const calculateDatesFromRange = (
    range: DateRangePreset
  ): { startDate?: string; endDate?: string } => {
    if (range === 'all') return {};

    const end = new Date();
    const start = new Date();

    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '3m':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setMonth(end.getMonth() - 3); // Default to 3m
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);

      const { startDate, endDate } = calculateDatesFromRange(dateRange);

      // Now passing dates to getPolicyAnalytics and getLicenseAnalytics
      // static data (overview) stays static or could ideally also be filtered if the user wanted,
      // but the implementation plan focused on policy/license analytics for charts.
      // NOTE: Overview usually contains "Total Policies" which might be "Total ALL time" or "Total in range".
      // The user complained about "numerical analysis values". The cards (Total Policies) are usually global totals.
      // But the charts are analysis.
      // Let's filter the analytics calls.

      const [overviewData, policyData, licenseData] = await Promise.all([
        analyticsApi.getOverview(), // Overview often remains global, or we could update it too. Plan didn't explicitly say overview.
        analyticsApi.getPolicyAnalytics(startDate, endDate),
        analyticsApi.getLicenseAnalytics(startDate, endDate),
      ]);

      setOverview(overviewData);
      setPolicyAnalytics(policyData);
      setLicenseAnalytics(licenseData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]); // Added dateRange dependency

  // Separate trend fetch or combine?
  // trends is already dependent on dateRange.
  // We can actually combine them or keep separate.
  // Since both depend on dateRange now, we can simplify/unify if we wanted,
  // but existing structure splits them.
  // The original useEffect for fetchAnalytics was [] (mount only).
  // Now it depends on [dateRange].

  const fetchTrends = useCallback(async () => {
    try {
      const period = getPeriodFromRange(dateRange);
      const months = getMonthsFromRange(dateRange);
      const trendsData = await analyticsApi.getTrends(period, months);
      setTrends(trendsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trends');
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const refetch = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchAnalytics(), fetchTrends()]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDateRange = (newRange: DateRangePreset) => {
    setDateRange(newRange);
    // fetchTrends will be called automatically due to useEffect dependency
  };

  return {
    overview,
    policyAnalytics,
    licenseAnalytics,
    trends,
    isLoading,
    error,
    dateRange,
    updateDateRange,
    refetch,
  };
}
