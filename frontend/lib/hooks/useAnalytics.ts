import { useState, useEffect } from 'react';
import { analyticsApi, OverviewAnalytics, PolicyAnalytics, TrendData } from '../api/analytics';

export function useAnalytics() {
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [policyAnalytics, setPolicyAnalytics] = useState<PolicyAnalytics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const [overviewData, policyData, trendsData] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getPolicyAnalytics(),
          analyticsApi.getTrends('monthly', 6),
        ]);

        setOverview(overviewData);
        setPolicyAnalytics(policyData);
        setTrends(trendsData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const refetch = async () => {
    setIsLoading(true);
    try {
      const [overviewData, policyData, trendsData] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getPolicyAnalytics(),
        analyticsApi.getTrends('monthly', 6),
      ]);

      setOverview(overviewData);
      setPolicyAnalytics(policyData);
      setTrends(trendsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    overview,
    policyAnalytics,
    trends,
    isLoading,
    error,
    refetch,
  };
}
