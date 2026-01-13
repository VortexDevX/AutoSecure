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

export interface PerformanceData {
  _id: string;
  count: number;
  total_premium: number;
  total_commission: number;
}

export interface CalendarEvent {
  id: string;
  type: 'policy' | 'license';
  title: string;
  date: string;
  registration?: string;
}

export interface CalendarEventsData {
  policies: CalendarEvent[];
  licenses: CalendarEvent[];
  total: number;
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
  async getPolicyAnalytics(startDate?: string, endDate?: string): Promise<PolicyAnalytics> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await apiClient.get<ApiResponse<PolicyAnalytics>>(
        `/api/v1/analytics/policies${queryString}`
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
    months: number = 6,
    startDate?: string,
    endDate?: string
  ): Promise<TrendData> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('months', months.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get<ApiResponse<TrendData>>(
        `/api/v1/analytics/trends?${params.toString()}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get license analytics
   */
  async getLicenseAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<{
    status_breakdown: Array<{ _id: string; count: number }>;
    expiring: {
      next_7_days: number;
      next_30_days: number;
      next_90_days: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await apiClient.get<ApiResponse<any>>(
        `/api/v1/analytics/licenses${queryString}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get branch performance data
   */
  async getBranchPerformance(startDate?: string, endDate?: string): Promise<PerformanceData[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await apiClient.get<ApiResponse<PerformanceData[]>>(
        `/api/v1/analytics/branches${queryString}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get insurance company performance data
   */
  async getInsuranceCompanyPerformance(
    startDate?: string,
    endDate?: string
  ): Promise<PerformanceData[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await apiClient.get<ApiResponse<PerformanceData[]>>(
        `/api/v1/analytics/insurance-companies${queryString}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get insurance dealer performance data
   */
  async getInsuranceDealerPerformance(
    startDate?: string,
    endDate?: string
  ): Promise<PerformanceData[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await apiClient.get<ApiResponse<PerformanceData[]>>(
        `/api/v1/analytics/insurance-dealers${queryString}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get executive performance data
   */
  async getExecutivePerformance(startDate?: string, endDate?: string): Promise<PerformanceData[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await apiClient.get<ApiResponse<PerformanceData[]>>(
        `/api/v1/analytics/executives${queryString}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get calendar events (expiring policies and licenses)
   */
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEventsData> {
    try {
      const response = await apiClient.get<ApiResponse<CalendarEventsData>>(
        `/api/v1/analytics/calendar-events?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
