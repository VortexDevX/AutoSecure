import apiClient from './client';
import {
  AuditLog,
  AuditLogFilters,
  AuditLogPagination,
  AuditLogsResponse,
  AuditLogStatsResponse,
} from '../types/auditLog';

export interface GetAuditLogsParams extends AuditLogFilters {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface GetAuditLogsResult {
  logs: AuditLog[];
  pagination: AuditLogPagination;
}

/**
 * Get audit logs with filters and pagination
 */
export const getAuditLogs = async (
  params: GetAuditLogsParams = {}
): Promise<GetAuditLogsResult> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.action && params.action !== 'all') queryParams.append('action', params.action);
  if (params.resource_type && params.resource_type !== 'all')
    queryParams.append('resource_type', params.resource_type);
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  if (params.search) queryParams.append('search', params.search);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_order) queryParams.append('sort_order', params.sort_order);

  const response = await apiClient.get<AuditLogsResponse>(
    `/api/v1/audit-logs?${queryParams.toString()}`
  );

  return response.data.data;
};

/**
 * Get audit log statistics
 */
export const getAuditLogStats = async (
  days: number = 7
): Promise<AuditLogStatsResponse['data']> => {
  const response = await apiClient.get<AuditLogStatsResponse>(
    `/api/v1/audit-logs/stats?days=${days}`
  );
  return response.data.data;
};

/**
 * Get single audit log by ID
 */
export const getAuditLogById = async (id: string): Promise<AuditLog> => {
  const response = await apiClient.get<{ success: boolean; data: { log: AuditLog } }>(
    `/api/v1/audit-logs/${id}`
  );
  return response.data.data.log;
};
