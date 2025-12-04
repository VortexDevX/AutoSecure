import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../utils/errors';
import { Readable } from 'stream';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'autosecure-files';

// R2 Endpoint
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Initialize S3 Client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadedFile {
  file_id: string;
  file_name: string;
  mime_type: string;
  web_view_link: string;
  file_path: string;
}

export class LicenseStorageService {
  /**
   * Upload a file to R2 under licenses folder
   */
  static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    licNo: string
  ): Promise<UploadedFile> {
    // Store in licenses/[LIC_NO]/ NOT policies/licenses/[LIC_NO]/
    const key = `licenses/${licNo}/${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);
      console.log(`✅ License file uploaded to R2: ${key}`);

      const fileId = key; // Full path as file_id for licenses

      return {
        file_id: fileId,
        file_name: fileName,
        mime_type: mimeType,
        web_view_link: `/api/v1/licenses/files/${licNo}/${fileName}`,
        file_path: key,
      };
    } catch (error: any) {
      console.error('R2 license upload error:', error);
      throw new AppError(`Failed to upload license file to R2: ${error.message}`, 500);
    }
  }

  /**
   * Download a license file from R2
   */
  static async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileId, // fileId is the full path for licenses
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new AppError('File not found in R2', 404);
      }

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      console.error('R2 license download error:', error);
      if (error.name === 'NoSuchKey') {
        throw new AppError('File not found', 404);
      }
      throw new AppError(`Failed to download license file from R2: ${error.message}`, 500);
    }
  }

  /**
   * Get a signed URL for direct file access
   */
  static async getSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileId,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error: any) {
      console.error('R2 license signed URL error:', error);
      throw new AppError(`Failed to generate signed URL: ${error.message}`, 500);
    }
  }

  /**
   * Delete a license file from R2
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileId,
      });

      await s3Client.send(command);
      console.log(`🗑️  License file deleted from R2: ${fileId}`);
    } catch (error: any) {
      console.error('R2 license delete error:', error);
      throw new AppError(`Failed to delete license file from R2: ${error.message}`, 500);
    }
  }

  /**
   * Backup license folder before deletion
   */
  static async backupLicenseFolder(licNo: string): Promise<string> {
    const sourcePrefix = `licenses/${licNo}/`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const destPrefix = `backups/licenses/${timestamp}/${licNo}/`;

    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: sourcePrefix,
      });

      const listResponse = await s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log(`⚠️ No files to backup in ${sourcePrefix}`);
        return destPrefix;
      }

      for (const obj of listResponse.Contents) {
        if (!obj.Key) continue;

        const fileName = obj.Key.replace(sourcePrefix, '');
        const destKey = `${destPrefix}${fileName}`;

        const copyCommand = new CopyObjectCommand({
          Bucket: R2_BUCKET_NAME,
          CopySource: `${R2_BUCKET_NAME}/${obj.Key}`,
          Key: destKey,
        });

        await s3Client.send(copyCommand);
        console.log(`📋 Copied: ${obj.Key} → ${destKey}`);
      }

      console.log(`✅ License backup complete: ${destPrefix}`);
      return destPrefix;
    } catch (error: any) {
      console.error('R2 license backup error:', error);
      throw new AppError(`Failed to backup license folder: ${error.message}`, 500);
    }
  }

  /**
   * Delete entire license folder from R2
   */
  static async deleteLicenseFolder(licNo: string): Promise<void> {
    const prefix = `licenses/${licNo}/`;

    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
      });

      const listResponse = await s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log(`⚠️ No files to delete in ${prefix}`);
        return;
      }

      for (const obj of listResponse.Contents) {
        if (!obj.Key) continue;

        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: obj.Key,
        });

        await s3Client.send(deleteCommand);
        console.log(`🗑️  Deleted: ${obj.Key}`);
      }

      console.log(`🗑️  License folder deleted: ${prefix}`);
    } catch (error: any) {
      console.error('R2 delete license folder error:', error);
      throw new AppError(`Failed to delete license folder: ${error.message}`, 500);
    }
  }
}
