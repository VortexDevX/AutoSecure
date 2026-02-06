import { useState, useEffect, useCallback } from 'react';
import {
  analyticsApi,
  OverviewAnalytics,
  PolicyAnalytics,
  LicenseAnalytics,
  TrendData,
  PerformanceData,
  CalendarEventsData,
} from '../api/analytics';
import { DateRangePreset } from '@/components/ui/DateRangeSelector';

export function useAnalytics() {
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [policyAnalytics, setPolicyAnalytics] = useState<PolicyAnalytics | null>(null);
  const [licenseAnalytics, setLicenseAnalytics] = useState<LicenseAnalytics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);

  // Performance data
  const [branchPerformance, setBranchPerformance] = useState<PerformanceData[] | null>(null);
  const [companyPerformance, setCompanyPerformance] = useState<PerformanceData[] | null>(null);
  const [dealerPerformance, setDealerPerformance] = useState<PerformanceData[] | null>(null);
  const [executivePerformance, setExecutivePerformance] = useState<PerformanceData[] | null>(null);

  // Calendar events
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventsData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_month');

  // Calculate start and end dates based on range preset
  const calculateDates = (range: DateRangePreset): { start: Date; end: Date } | null => {
    if (range === 'all') return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (range) {
      case '7d': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
        return { start, end: today };
      }
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        return { start, end: today };
      }
      case 'last_month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return { start, end };
      }
      case 'this_year': {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        return { start, end: today };
      }
      case 'last_year': {
        const start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
        const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        return { start, end };
      }
      default:
        return null;
    }
  };

  // Get period type for trends API
  const getTrendsPeriod = (range: DateRangePreset): 'daily' | 'monthly' | 'yearly' => {
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
      default:
        return 'monthly';
    }
  };

  // Get months count for trends API
  const getTrendsMonths = (range: DateRangePreset): number => {
    switch (range) {
      case '7d':
        return 1;
      case 'this_month':
      case 'last_month':
        return 2;
      case 'this_year':
      case 'last_year':
        return 12;
      case 'all':
        return 60;
      default:
        return 6;
    }
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dates = calculateDates(dateRange);
      const startDate = dates?.start.toISOString();
      const endDate = dates?.end.toISOString();

      console.log('Fetching with dates:', { dateRange, startDate, endDate });

      const [
        overviewData,
        policyData,
        licenseData,
        branchData,
        companyData,
        dealerData,
        executiveData,
      ] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getPolicyAnalytics(startDate, endDate),
        analyticsApi.getLicenseAnalytics(startDate, endDate),
        analyticsApi.getBranchPerformance(startDate, endDate),
        analyticsApi.getInsuranceCompanyPerformance(startDate, endDate),
        analyticsApi.getInsuranceDealerPerformance(startDate, endDate),
        analyticsApi.getExecutivePerformance(startDate, endDate),
      ]);

      setOverview(overviewData);
      setPolicyAnalytics(policyData);
      setLicenseAnalytics(licenseData);
      setBranchPerformance(branchData);
      setCompanyPerformance(companyData);
      setDealerPerformance(dealerData);
      setExecutivePerformance(executiveData);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError((err as Error).message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  const fetchTrends = useCallback(async () => {
    try {
      const period = getTrendsPeriod(dateRange);
      const months = getTrendsMonths(dateRange);
      const dates = calculateDates(dateRange);
      const startDate = dates?.start.toISOString();
      const endDate = dates?.end.toISOString();

      console.log('Fetching trends:', { dateRange, period, months, startDate, endDate });
      const trendsData = await analyticsApi.getTrends(period, months, startDate, endDate);
      setTrends(trendsData);
    } catch (err) {
      console.error('Trends fetch error:', err);
      setError((err as Error).message || 'Failed to fetch trends');
    }
  }, [dateRange]);

  const fetchCalendarEvents = useCallback(async () => {
    try {
      // Fetch calendar events for current month + 2 months ahead
      const start = new Date();
      start.setDate(1); // Start of current month
      const end = new Date();
      end.setMonth(end.getMonth() + 3);
      end.setDate(0); // End of month 2 months ahead

      const calendarData = await analyticsApi.getCalendarEvents(
        start.toISOString(),
        end.toISOString()
      );
      setCalendarEvents(calendarData);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  const refetch = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchAnalytics(), fetchTrends(), fetchCalendarEvents()]);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDateRange = (newRange: DateRangePreset) => {
    setDateRange(newRange);
  };

  return {
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
    dateRange,
    updateDateRange,
    refetch,
  };
}
