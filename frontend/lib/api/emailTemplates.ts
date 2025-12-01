import apiClient from './client';
import {
  EmailTemplate,
  EmailTemplateListResponse,
  EmailTemplateResponse,
  EmailTemplateUpdatePayload,
} from '../types/emailTemplate';

/**
 * Get all email templates
 */
export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await apiClient.get<EmailTemplateListResponse>('/api/v1/email-templates');
  return response.data.data;
};

/**
 * Get single email template by ID
 */
export const getEmailTemplate = async (id: string): Promise<EmailTemplate> => {
  const response = await apiClient.get<EmailTemplateResponse>(`/api/v1/email-templates/${id}`);
  return response.data.data;
};

/**
 * Update email template
 */
export const updateEmailTemplate = async (
  id: string,
  payload: EmailTemplateUpdatePayload
): Promise<EmailTemplate> => {
  const response = await apiClient.patch<EmailTemplateResponse>(
    `/api/v1/email-templates/${id}`,
    payload
  );
  return response.data.data;
};

/**
 * Toggle template active status
 */
export const toggleTemplateStatus = async (id: string, active: boolean): Promise<EmailTemplate> => {
  return updateEmailTemplate(id, { active });
};
