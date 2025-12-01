import { useState, useEffect } from 'react';
import useSWR from 'swr';
import apiClient from '../api/client';
import { PaginatedResponse } from '../types/api';
import { PolicyListItem } from '../types/policy';

interface UsePoliciesParams {
  page?: number;
  limit?: number;
  search?: string;
  branch_id?: string;
  ins_status?: string;
  customer_payment_status?: string;
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

  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/policies?${queryParams.toString()}`,
    async (url: string) => {
      const response = await apiClient.get(url);

      console.log('Policies API response:', response.data); // Debug log

      // Backend returns: { status: 'success', data: { policies: [...], pagination: {...} } }
      return response.data.data;
    }
  );

  console.log('Parsed policies data:', data); // Debug log

  return {
    policies: data?.policies || [], // ✅ Fixed: was data?.data
    pagination: data?.pagination,
    isLoading,
    error: error?.message,
    mutate,
  };
}
