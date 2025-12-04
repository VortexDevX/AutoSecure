import { Request, Response } from 'express';
import { FileStorageService } from '../services/fileStorageService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';

/**
 * Get license file (stream/view)
 * GET /api/v1/licenses/files/:folderName/:fileName
 */
export const getLicenseFile = asyncHandler(async (req: Request, res: Response) => {
  const { folderName, fileName } = req.params;

  if (!folderName || !fileName) {
    throw new AppError('Folder name and file name are required', 400);
  }

  const fileId = `licenses/${folderName}/${fileName}`;

  // Check if file exists
  const exists = await FileStorageService.licenseFileExists(fileId);
  if (!exists) {
    throw new AppError('File not found', 404);
  }

  // Get file content
  const fileBuffer = await FileStorageService.downloadLicenseFile(fileId);
  const metadata = await FileStorageService.getLicenseFileMetadata(fileId);

  // Set headers for inline viewing
  res.setHeader('Content-Type', metadata.contentType);
  res.setHeader('Content-Length', metadata.size);
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');

  res.send(fileBuffer);
});

/**
 * Get signed URL for license file (for frontend to open in new tab)
 * GET /api/v1/licenses/files/:folderName/:fileName/url
 */
export const getLicenseFileUrl = asyncHandler(async (req: Request, res: Response) => {
  const { folderName, fileName } = req.params;

  if (!folderName || !fileName) {
    throw new AppError('Folder name and file name are required', 400);
  }

  const fileId = `licenses/${folderName}/${fileName}`;

  // Check if file exists
  const exists = await FileStorageService.licenseFileExists(fileId);
  if (!exists) {
    throw new AppError('File not found', 404);
  }

  // Generate signed URL
  const signedUrl = await FileStorageService.getSignedUrl(fileId, 3600);

  res.json({
    success: true,
    data: { url: signedUrl },
  });
});

/**
 * Download license file (streams file with attachment disposition)
 * GET /api/v1/licenses/files/:folderName/:fileName/download
 */
export const downloadLicenseFile = asyncHandler(async (req: Request, res: Response) => {
  const { folderName, fileName } = req.params;
  const downloadName = (req.query.name as string) || fileName;

  if (!folderName || !fileName) {
    throw new AppError('Folder name and file name are required', 400);
  }

  const fileId = `licenses/${folderName}/${fileName}`;

  // Check if file exists
  const exists = await FileStorageService.licenseFileExists(fileId);
  if (!exists) {
    throw new AppError('File not found', 404);
  }

  // Get file content
  const fileBuffer = await FileStorageService.downloadLicenseFile(fileId);
  const metadata = await FileStorageService.getLicenseFileMetadata(fileId);

  // Set headers for download
  res.setHeader('Content-Type', metadata.contentType);
  res.setHeader('Content-Length', metadata.size);
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Cache-Control', 'private, no-cache');

  res.send(fileBuffer);
});
