import { Request, Response } from 'express';
import { FileStorageService } from '../services/fileStorageService';
import { Policy } from '../models/Policy';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';
import path from 'path';

/**
 * GET /api/v1/files/:policyNo/:fileName
 * View a policy file (inline - opens in browser)
 */
export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const { policyNo, fileName } = req.params;

  // Verify policy exists and user has access
  const policy = await Policy.findOne({ policy_no: policyNo });

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  // Role-based access control
  if (req.user!.role === 'user' && policy.created_by.toString() !== req.user!.userId) {
    throw new AuthorizationError('You do not have access to this policy');
  }

  const fileId = `${policyNo}/${fileName}`;

  // Check if file exists
  const exists = await FileStorageService.fileExists(fileId);
  if (!exists) {
    throw new NotFoundError('File not found');
  }

  // Option 1: Redirect to signed URL (faster, less bandwidth on server)
  const signedUrl = await FileStorageService.getSignedUrl(fileId, 3600); // 1 hour
  res.redirect(signedUrl);

  // Option 2: Proxy the file through backend (uncomment if you prefer)
  /*
  const fileBuffer = await FileStorageService.downloadFile(fileId);
  const metadata = await FileStorageService.getFileMetadata(fileId);

  res.setHeader('Content-Type', metadata.contentType);
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  res.setHeader('Content-Length', metadata.size);
  res.setHeader('Cache-Control', 'private, max-age=3600');

  res.send(fileBuffer);
  */
});

/**
 * GET /api/v1/files/:policyNo/:fileName/download
 * Force download (attachment)
 */
export const forceDownloadFile = asyncHandler(async (req: Request, res: Response) => {
  const { policyNo, fileName } = req.params;

  // Verify policy exists and user has access
  const policy = await Policy.findOne({ policy_no: policyNo });

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  // Role-based access control
  if (req.user!.role === 'user' && policy.created_by.toString() !== req.user!.userId) {
    throw new AuthorizationError('You do not have access to this policy');
  }

  const fileId = `${policyNo}/${fileName}`;

  // Check if file exists
  const exists = await FileStorageService.fileExists(fileId);
  if (!exists) {
    throw new NotFoundError('File not found');
  }

  // Generate signed URL with download disposition
  const signedUrl = await FileStorageService.getDownloadUrl(fileId, fileName, 3600);
  res.redirect(signedUrl);
});

/**
 * GET /api/v1/files/:policyNo/:fileName/url
 * Get a temporary signed URL for the file (useful for frontend)
 */
export const getFileUrl = asyncHandler(async (req: Request, res: Response) => {
  const { policyNo, fileName } = req.params;
  const { download } = req.query;

  // Verify policy exists and user has access
  const policy = await Policy.findOne({ policy_no: policyNo });

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  // Role-based access control
  if (req.user!.role === 'user' && policy.created_by.toString() !== req.user!.userId) {
    throw new AuthorizationError('You do not have access to this policy');
  }

  const fileId = `${policyNo}/${fileName}`;

  // Check if file exists
  const exists = await FileStorageService.fileExists(fileId);
  if (!exists) {
    throw new NotFoundError('File not found');
  }

  // Generate signed URL
  const signedUrl =
    download === 'true'
      ? await FileStorageService.getDownloadUrl(fileId, fileName, 3600)
      : await FileStorageService.getSignedUrl(fileId, 3600);

  res.json({
    status: 'success',
    data: {
      url: signedUrl,
      expires_in: 3600,
    },
  });
});

/**
 * DELETE /api/v1/policies/:id/files/:fileType/:fileIndex?
 * Delete a specific file from a policy
 */
export const deletePolicyFile = asyncHandler(async (req: Request, res: Response) => {
  const { id, fileType, fileIndex } = req.params;

  // Validate file type
  const validFileTypes = ['adh_file', 'pan_file', 'other_document'];
  if (!validFileTypes.includes(fileType)) {
    throw new ValidationError(`Invalid file type: ${fileType}`);
  }

  // Find policy
  const policy = await Policy.findById(id);
  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  // Role-based access control - only admin/owner can delete files
  if (req.user!.role === 'user') {
    throw new AuthorizationError('You do not have permission to delete files');
  }

  let deletedFileName = '';

  if (fileType === 'adh_file') {
    if (!policy.adh_file) {
      throw new NotFoundError('Aadhaar file not found');
    }
    deletedFileName = policy.adh_file.file_name;

    // Delete from R2
    try {
      await FileStorageService.deleteFile(`${policy.policy_no}/${deletedFileName}`);
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
    }

    // Remove from policy
    policy.adh_file = undefined;
  } else if (fileType === 'pan_file') {
    if (!policy.pan_file) {
      throw new NotFoundError('PAN file not found');
    }
    deletedFileName = policy.pan_file.file_name;

    // Delete from R2
    try {
      await FileStorageService.deleteFile(`${policy.policy_no}/${deletedFileName}`);
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
    }

    // Remove from policy
    policy.pan_file = undefined;
  } else if (fileType === 'other_document') {
    const index = parseInt(fileIndex || '0', 10);

    if (!policy.other_documents || !policy.other_documents[index]) {
      throw new NotFoundError('Document not found');
    }

    deletedFileName = policy.other_documents[index].file_name;

    // Delete from R2
    try {
      await FileStorageService.deleteFile(`${policy.policy_no}/${deletedFileName}`);
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
    }

    // Remove from array
    policy.other_documents.splice(index, 1);
  }

  await policy.save();

  // Audit log
  await AuditService.logDelete(req.user!.userId, 'policy', policy._id.toString(), {
    policy_no: policy.policy_no,
    file_type: fileType,
    file_name: deletedFileName,
    action_type: 'file_delete',
  });

  res.json({
    status: 'success',
    message: 'File deleted successfully',
    data: {
      policy,
    },
  });
});
