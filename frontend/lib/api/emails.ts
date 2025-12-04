import apiClient from './client';

/**
 * Get recipient email address
 */
export const getRecipientEmail = async (): Promise<string> => {
  const response = await apiClient.get<{ success: boolean; data: { email: string } }>(
    '/api/v1/emails/recipient'
  );
  return response.data.data.email;
};

/**
 * Send policy backup email with attachments
 */
export const sendBackupEmail = async (
  policyId: string,
  selectedAttachments: string[],
  newFiles: File[]
): Promise<void> => {
  const formData = new FormData();
  formData.append('policy_id', policyId);
  formData.append('selected_attachments', JSON.stringify(selectedAttachments));

  newFiles.forEach((file) => {
    formData.append('attachments', file);
  });

  await apiClient.post('/api/v1/emails/send-backup', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Send license backup email with attachments
 */
export const sendLicenseBackupEmail = async (
  licenseId: string,
  selectedAttachments: string[],
  newFiles: File[]
): Promise<void> => {
  const formData = new FormData();
  formData.append('license_id', licenseId);
  formData.append('selected_attachments', JSON.stringify(selectedAttachments));

  newFiles.forEach((file) => {
    formData.append('attachments', file);
  });

  await apiClient.post('/api/v1/emails/send-license-backup', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Get email logs for a policy
 */
export const getEmailLogs = async (policyId: string, limit = 10): Promise<any[]> => {
  const response = await apiClient.get<{ success: boolean; data: any[] }>(
    `/api/v1/emails/logs/${policyId}`,
    { params: { limit } }
  );
  return response.data.data;
};

/**
 * Get email logs for a license
 */
export const getLicenseEmailLogs = async (licenseId: string, limit = 10): Promise<any[]> => {
  const response = await apiClient.get<{ success: boolean; data: any[] }>(
    `/api/v1/emails/license-logs/${licenseId}`,
    { params: { limit } }
  );
  return response.data.data;
};
