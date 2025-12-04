import { Request, Response } from 'express';
import { emailService } from '../services/emailService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';

/**
 * Send policy backup email with selected attachments
 * POST /api/v1/emails/send-backup
 */
export const sendBackupEmail = asyncHandler(async (req: Request, res: Response) => {
  const { policy_id, selected_attachments } = req.body;

  if (!policy_id) {
    throw new AppError('policy_id is required', 400);
  }

  let parsedAttachments: string[] = [];
  if (selected_attachments) {
    try {
      parsedAttachments =
        typeof selected_attachments === 'string'
          ? JSON.parse(selected_attachments)
          : selected_attachments;
    } catch (e) {
      console.warn('Failed to parse selected_attachments:', e);
      parsedAttachments = [];
    }
  }

  const uploadedFiles = req.files as Express.Multer.File[] | undefined;

  console.log('📧 Send Backup Email Request:', {
    policy_id,
    selected_attachments: parsedAttachments,
    uploaded_files_count: uploadedFiles?.length || 0,
  });

  await emailService.sendBackupEmail({
    policyId: policy_id,
    selectedAttachments: parsedAttachments,
    uploadedFiles: uploadedFiles || [],
    userId: req.user!.userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'Policy backup email sent successfully',
  });
});

/**
 * Send license backup email with selected attachments
 * POST /api/v1/emails/send-license-backup
 */
export const sendLicenseBackupEmail = asyncHandler(async (req: Request, res: Response) => {
  const { license_id, selected_attachments } = req.body;

  if (!license_id) {
    throw new AppError('license_id is required', 400);
  }

  let parsedAttachments: string[] = [];
  if (selected_attachments) {
    try {
      parsedAttachments =
        typeof selected_attachments === 'string'
          ? JSON.parse(selected_attachments)
          : selected_attachments;
    } catch (e) {
      console.warn('Failed to parse selected_attachments:', e);
      parsedAttachments = [];
    }
  }

  const uploadedFiles = req.files as Express.Multer.File[] | undefined;

  console.log('📧 Send License Backup Email Request:', {
    license_id,
    selected_attachments: parsedAttachments,
    uploaded_files_count: uploadedFiles?.length || 0,
  });

  await emailService.sendLicenseBackupEmail({
    licenseId: license_id,
    selectedAttachments: parsedAttachments,
    uploadedFiles: uploadedFiles || [],
    userId: req.user!.userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'License backup email sent successfully',
  });
});

/**
 * Get email logs for a policy
 * GET /api/v1/emails/logs/:policyId
 */
export const getEmailLogs = asyncHandler(async (req: Request, res: Response) => {
  const { policyId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  const logs = await emailService.getEmailLogs(policyId, limit);

  res.json({
    success: true,
    count: logs.length,
    data: logs,
  });
});

/**
 * Get email logs for a license
 * GET /api/v1/emails/license-logs/:licenseId
 */
export const getLicenseEmailLogs = asyncHandler(async (req: Request, res: Response) => {
  const { licenseId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  const logs = await emailService.getLicenseEmailLogs(licenseId, limit);

  res.json({
    success: true,
    count: logs.length,
    data: logs,
  });
});

/**
 * Get recipient email (for frontend display)
 * GET /api/v1/emails/recipient
 */
export const getRecipientEmail = asyncHandler(async (req: Request, res: Response) => {
  const recipientEmail = process.env.BACKUP_EMAIL || 'backup@autosecure.local';

  res.json({
    success: true,
    data: {
      email: recipientEmail,
    },
  });
});
