import apiClient from './client';

export interface SendEmailResponse {
  success: boolean;
  message: string;
}

export interface RecipientEmailResponse {
  success: boolean;
  data: {
    email: string;
  };
}

export interface EmailLog {
  _id: string;
  policy_id: string;
  template_id: string;
  sent_to: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  sent_by: {
    _id: string;
    email: string;
    role: string;
  };
  sent_at?: string;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface EmailLogsResponse {
  success: boolean;
  count: number;
  data: EmailLog[];
}

/**
 * Get hardcoded recipient email
 */
export const getRecipientEmail = async (): Promise<string> => {
  const response = await apiClient.get<RecipientEmailResponse>('/api/v1/emails/recipient');
  return response.data.data.email;
};

/**
 * Send policy backup email with attachments
 */
export const sendBackupEmail = async (
  policyId: string,
  selectedAttachments: string[],
  newAttachments?: File[]
): Promise<void> => {
  const formData = new FormData();
  formData.append('policy_id', policyId);
  formData.append('selected_attachments', JSON.stringify(selectedAttachments));

  // Add new uploaded files
  if (newAttachments && newAttachments.length > 0) {
    newAttachments.forEach((file) => {
      formData.append('attachments', file);
    });
  }

  const response = await apiClient.post<SendEmailResponse>('/api/v1/emails/send-backup', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to send email');
  }
};

/**
 * Get email logs for a policy
 */
export const getEmailLogs = async (policyId: string, limit = 10): Promise<EmailLog[]> => {
  const response = await apiClient.get<EmailLogsResponse>(
    `/api/v1/emails/logs/${policyId}?limit=${limit}`
  );
  return response.data.data;
};
