import useSWR from 'swr';
import apiClient from '../api/client';
import { PolicyListItem } from '../types/policy';

interface UsePoliciesParams {
  page?: number;
  limit?: number;
  search?: string;
  branch_id?: string;
  ins_status?: string;
  customer_payment_status?: string;
  expiring_soon?: boolean;
}

export function usePolicies(params: UsePoliciesParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.branch_id) queryParams.append('branch_id', params.branch_id);
  if (params.ins_status) queryParams.append('ins_status', params.ins_status);
  if (params.customer_payment_status)
    queryParams.append('customer_payment_status', params.customer_payment_status);

  // FIX: Check for boolean specifically
  if (typeof params.expiring_soon === 'boolean') {
    queryParams.append('expiring_soon', params.expiring_soon.toString());
  }

  const url = `/api/v1/policies?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(url, async (url: string) => {
    const response = await apiClient.get(url);
    return response.data.data;
  });

  return {
    policies: (data?.policies || []) as PolicyListItem[],
    pagination: data?.pagination,
    isLoading,
    error: error?.message,
    mutate,
  };
}
