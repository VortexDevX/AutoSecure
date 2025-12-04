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
