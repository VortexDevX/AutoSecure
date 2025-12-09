import apiClient from './client';

export interface ExportFilters {
  branch_id?: string;
  ins_status?: string;
  ins_co_id?: string;
  ins_type?: string;
  exicutive_name?: string;
  customer_payment_status?: string;
  customer_name?: string;
  lic_no?: string;
  license_type?: string;
  approved?: string;
  faceless_type?: string;
  expiring_soon?: boolean | string;
  expiry_year?: string;
}

export interface ExportDateRange {
  start?: string;
  end?: string;
}

export interface ExportParams {
  fields?: string[];
  date_range?: ExportDateRange;
  filters?: ExportFilters;
}

export interface ExportCountParams {
  date_range?: ExportDateRange;
  filters?: ExportFilters;
}

/**
 * Get count of policies matching export criteria
 */
export async function getExportCount(params: ExportCountParams): Promise<number> {
  const response = await apiClient.post('/api/v1/exports/policies/count', params);
  return response.data.data.count;
}

/**
 * Export policies to Excel
 */
export async function exportPolicies(params: ExportParams): Promise<Blob> {
  const response = await apiClient.post('/api/v1/exports/policies', params, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Trigger download of exported file
 */
export function downloadExportFile(blob: Blob, filename?: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `policies_export_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Get count of licenses matching export criteria
 */
export async function getExportLicenseCount(params: ExportCountParams): Promise<number> {
  const response = await apiClient.post('/api/v1/exports/licenses/count', params);
  return response.data.data.count;
}

/**
 * Export licenses to Excel
 */
export async function exportLicenses(params: ExportCountParams): Promise<Blob> {
  const response = await apiClient.post('/api/v1/exports/licenses', params, {
    responseType: 'blob',
  });
  return response.data;
}
