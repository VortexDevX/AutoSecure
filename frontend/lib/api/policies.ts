import apiClient from './client';
import { Policy } from '@/lib/types/policy';

export interface PolicyResponse {
  status: string;
  data: {
    policy: Policy;
  };
}

export interface PoliciesResponse {
  status: string;
  data: {
    policies: Policy[]; // This should be the full Policy type, not PolicyListItem
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

/**
 * Get single policy by ID
 */
export const getPolicyById = async (id: string): Promise<Policy> => {
  const response = await apiClient.get<PolicyResponse>(`/api/v1/policies/${id}`);
  return response.data.data.policy;
};

/**
 * Create new policy
 */
export const createPolicy = async (formData: FormData): Promise<Policy> => {
  const response = await apiClient.post<PolicyResponse>('/api/v1/policies', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.policy;
};

/**
 * Update existing policy
 */
export const updatePolicy = async (id: string, formData: FormData): Promise<Policy> => {
  const response = await apiClient.patch<PolicyResponse>(`/api/v1/policies/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.policy;
};

/**
 * Delete policy
 */
export const deletePolicy = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/policies/${id}`);
};

/**
 * Get signed URL for a file (from R2)
 */
export const getFileSignedUrl = async (
  policyNo: string,
  fileName: string,
  download: boolean = false
): Promise<string> => {
  const response = await apiClient.get<{
    status: string;
    data: { url: string; expires_in: number };
  }>(`/api/v1/files/${policyNo}/${fileName}/url`, {
    params: { download: download ? 'true' : 'false' },
  });
  return response.data.data.url;
};

/**
 * Get file as blob (fetches from R2 signed URL)
 */
export const getFileBlob = async (policyNo: string, fileName: string): Promise<Blob> => {
  // Get signed URL from backend
  const signedUrl = await getFileSignedUrl(policyNo, fileName, false);

  // Fetch file directly from R2
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  return response.blob();
};

/**
 * View file in new tab (opens R2 signed URL directly)
 */
export const viewFile = async (policyNo: string, fileName: string): Promise<void> => {
  try {
    // Get signed URL from backend
    const signedUrl = await getFileSignedUrl(policyNo, fileName, false);

    // Open signed URL in new tab
    window.open(signedUrl, '_blank');
  } catch (error) {
    console.error('Failed to view file:', error);
    throw error;
  }
};

/**
 * Download file (uses R2 signed URL with download disposition)
 */
export const downloadFile = async (
  policyNo: string,
  fileName: string,
  downloadName?: string
): Promise<void> => {
  try {
    // Get signed URL with download disposition
    const signedUrl = await getFileSignedUrl(policyNo, fileName, true);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = downloadName || fileName;
    link.target = '_blank'; // Fallback for browsers that don't support download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw error;
  }
};

/**
 * Delete a specific file from a policy
 */
export const deletePolicyFile = async (
  policyId: string,
  fileType: 'adh_file' | 'pan_file' | 'other_document',
  fileIndex?: number
): Promise<Policy> => {
  const response = await apiClient.delete<PolicyResponse>(
    `/api/v1/policies/${policyId}/files/${fileType}${fileIndex !== undefined ? `/${fileIndex}` : ''}`
  );
  return response.data.data.policy;
};
