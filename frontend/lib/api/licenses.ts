import apiClient from './client';
import { LicenseRecord, LicenseFormData } from '@/lib/types/license';

export interface LicensesResponse {
  success: boolean;
  data: {
    licenses: LicenseRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface LicenseResponse {
  success: boolean;
  data: {
    license: LicenseRecord;
  };
}

/**
 * Get all licenses
 */
export const getLicenses = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  approved?: boolean;
  expiring_soon?: boolean;
  faceless_type?: string;
}): Promise<LicensesResponse['data']> => {
  const response = await apiClient.get<LicensesResponse>('/api/v1/licenses', { params });
  return response.data.data;
};

/**
 * Get single license
 */
export const getLicenseById = async (id: string): Promise<LicenseRecord> => {
  const response = await apiClient.get<LicenseResponse>(`/api/v1/licenses/${id}`);
  return response.data.data.license;
};

/**
 * Create license with documents
 */
export const createLicense = async (data: LicenseFormData): Promise<LicenseRecord> => {
  const formData = new FormData();

  // Append all fields except documents
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'documents' || key === 'existing_documents') return;
    if (value === undefined || value === null || value === '') return;

    if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (typeof value === 'boolean') {
      formData.append(key, String(value));
    } else if (typeof value === 'number') {
      formData.append(key, String(value));
    } else {
      formData.append(key, String(value).toUpperCase());
    }
  });

  // Handle documents with labels
  if (data.documents && data.documents.length > 0) {
    const labels: string[] = [];
    data.documents.forEach((doc) => {
      formData.append('documents', doc.file);
      labels.push(doc.label);
    });
    formData.append('document_labels', JSON.stringify(labels));
  }

  const response = await apiClient.post<LicenseResponse>('/api/v1/licenses', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.license;
};

/**
 * Update license
 */
export const updateLicense = async (id: string, data: LicenseFormData): Promise<LicenseRecord> => {
  const formData = new FormData();

  // Append all fields except documents
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'documents' || key === 'existing_documents') return;
    if (value === undefined || value === null || value === '') return;

    if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (typeof value === 'boolean') {
      formData.append(key, String(value));
    } else if (typeof value === 'number') {
      formData.append(key, String(value));
    } else {
      formData.append(key, String(value).toUpperCase());
    }
  });

  // Handle new documents with labels
  if (data.documents && data.documents.length > 0) {
    const labels: string[] = [];
    data.documents.forEach((doc) => {
      formData.append('documents', doc.file);
      labels.push(doc.label);
    });
    formData.append('document_labels', JSON.stringify(labels));
  }

  const response = await apiClient.patch<LicenseResponse>(`/api/v1/licenses/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.license;
};

/**
 * Delete license
 */
export const deleteLicense = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/licenses/${id}`);
};

/**
 * Get expiring licenses
 */
export const getExpiringLicenses = async (days = 90): Promise<LicenseRecord[]> => {
  const response = await apiClient.get<{ success: boolean; data: { licenses: LicenseRecord[] } }>(
    '/api/v1/licenses/expiring-soon',
    { params: { days } }
  );
  return response.data.data.licenses;
};

// ============================================
// License File Helpers
// ============================================

/**
 * Parse file_id to get folder and file name
 * file_id format: "licenses/FOLDER_NAME/FILE_NAME"
 */
const parseFileId = (fileId: string): { folderName: string; fileName: string } => {
  const parts = fileId.split('/');
  if (parts.length < 3) {
    throw new Error('Invalid file ID format');
  }
  return {
    folderName: parts[1],
    fileName: parts[2],
  };
};

/**
 * Get signed URL for a license file
 */
export const getLicenseFileUrl = async (fileId: string): Promise<string> => {
  const { folderName, fileName } = parseFileId(fileId);

  const response = await apiClient.get<{ success: boolean; data: { url: string } }>(
    `/api/v1/licenses/files/${folderName}/${fileName}/url`
  );
  return response.data.data.url;
};

/**
 * View license file in new tab (uses signed URL)
 */
export const viewLicenseFile = async (fileId: string): Promise<void> => {
  const signedUrl = await getLicenseFileUrl(fileId);
  window.open(signedUrl, '_blank');
};

/**
 * Download license file via backend proxy (avoids CORS issues)
 */
export const downloadLicenseFile = async (fileId: string, downloadName: string): Promise<void> => {
  const { folderName, fileName } = parseFileId(fileId);

  try {
    // Use axios to get file as blob through backend proxy
    const response = await apiClient.get(
      `/api/v1/licenses/files/${folderName}/${fileName}/download`,
      {
        params: { name: downloadName },
        responseType: 'blob',
      }
    );

    // Create blob URL and trigger download
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = downloadName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

/**
 * Delete a specific document from a license
 */
export const deleteLicenseDocument = async (
  licenseId: string,
  docIndex: number
): Promise<LicenseRecord> => {
  const response = await apiClient.delete<LicenseResponse>(
    `/api/v1/licenses/${licenseId}/documents/${docIndex}`
  );
  return response.data.data.license;
};
