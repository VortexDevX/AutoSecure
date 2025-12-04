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
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: if you set up a public domain

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

export class FileStorageService {
  /**
   * Check if R2 is properly configured
   */
  static isConfigured(): boolean {
    return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
  }

  /**
   * Create a "folder" for a policy (in S3/R2, folders are just prefixes)
   * This is essentially a no-op, but we keep it for API compatibility
   */
  static async createPolicyFolder(policyNo: string): Promise<string> {
    // In R2/S3, folders don't really exist - they're implied by object keys
    // We just return the folder ID (policy number) for consistency
    console.log(`✅ Policy folder ready: policies/${policyNo}/`);
    return policyNo;
  }

  /**
   * Upload a file to R2
   */
  static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string // This is the policy number
  ): Promise<UploadedFile> {
    const key = `policies/${folderId}/${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);
      console.log(`✅ File uploaded to R2: ${key}`);

      const fileId = `${folderId}/${fileName}`;

      return {
        file_id: fileId,
        file_name: fileName,
        mime_type: mimeType,
        web_view_link: `/api/v1/files/${folderId}/${fileName}`,
        file_path: key,
      };
    } catch (error: any) {
      console.error('R2 upload error:', error);
      throw new AppError(`Failed to upload file to R2: ${error.message}`, 500);
    }
  }

  /**
   * Download a file from R2
   */
  static async downloadFile(fileId: string): Promise<Buffer> {
    const key = `policies/${fileId}`;

    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new AppError('File not found in R2', 404);
      }

      // Convert stream to buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      console.error('R2 download error:', error);
      if (error.name === 'NoSuchKey') {
        throw new AppError('File not found', 404);
      }
      throw new AppError(`Failed to download file from R2: ${error.message}`, 500);
    }
  }

  /**
   * Get a signed URL for direct file access (expires in 1 hour by default)
   */
  static async getSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    const key = `policies/${fileId}`;

    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error: any) {
      console.error('R2 signed URL error:', error);
      throw new AppError(`Failed to generate signed URL: ${error.message}`, 500);
    }
  }

  /**
   * Get a signed URL for downloading (with Content-Disposition: attachment)
   */
  static async getDownloadUrl(
    fileId: string,
    fileName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const key = `policies/${fileId}`;

    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${fileName}"`,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error: any) {
      console.error('R2 download URL error:', error);
      throw new AppError(`Failed to generate download URL: ${error.message}`, 500);
    }
  }

  /**
   * Check if a file exists in R2
   */
  static async fileExists(fileId: string): Promise<boolean> {
    const key = `policies/${fileId}`;

    try {
      const command = new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete a file from R2
   */
  static async deleteFile(fileId: string): Promise<void> {
    const key = `policies/${fileId}`;

    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      console.log(`🗑️  File deleted from R2: ${key}`);
    } catch (error: any) {
      console.error('R2 delete error:', error);
      throw new AppError(`Failed to delete file from R2: ${error.message}`, 500);
    }
  }

  /**
   * List all files in a policy folder
   */
  static async listPolicyFiles(policyNo: string): Promise<string[]> {
    const prefix = `policies/${policyNo}/`;

    try {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
      });

      const response = await s3Client.send(command);
      const files = response.Contents?.map((obj) => obj.Key!.replace(prefix, '')) || [];

      return files;
    } catch (error: any) {
      console.error('R2 list error:', error);
      throw new AppError(`Failed to list files: ${error.message}`, 500);
    }
  }

  /**
   * Copy files to backup folder in R2
   */
  static async copyFolder(sourceFolderId: string, destinationPath: string): Promise<string> {
    const sourcePrefix = `policies/${sourceFolderId}/`;
    const destPrefix = `backups/${destinationPath}/`;

    try {
      // List all files in source folder
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: sourcePrefix,
      });

      const listResponse = await s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log(`⚠️ No files to backup in ${sourcePrefix}`);
        return destPrefix;
      }

      // Copy each file
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

      console.log(`✅ Folder copied: ${sourcePrefix} → ${destPrefix}`);
      return destPrefix;
    } catch (error: any) {
      console.error('R2 copy folder error:', error);
      throw new AppError(`Failed to copy folder: ${error.message}`, 500);
    }
  }

  /**
   * Backup policy folder before deletion
   */
  static async backupPolicyFolder(policyNo: string, sourceFolderId: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${timestamp}/${policyNo}`;

      await this.copyFolder(sourceFolderId, backupPath);

      console.log(`✅ Policy backup complete: backups/${backupPath}/`);
      return backupPath;
    } catch (error: any) {
      console.error('Policy backup error:', error);
      throw new AppError(`Failed to backup policy: ${error.message}`, 500);
    }
  }

  /**
   * Delete entire policy folder from R2
   */
  static async deletePolicyFolder(policyNo: string): Promise<void> {
    const prefix = `policies/${policyNo}/`;

    try {
      // List all files in folder
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
      });

      const listResponse = await s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log(`⚠️ No files to delete in ${prefix}`);
        return;
      }

      // Delete each file
      for (const obj of listResponse.Contents) {
        if (!obj.Key) continue;

        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: obj.Key,
        });

        await s3Client.send(deleteCommand);
        console.log(`🗑️  Deleted: ${obj.Key}`);
      }

      console.log(`🗑️  Policy folder deleted: ${prefix}`);
    } catch (error: any) {
      console.error('R2 delete folder error:', error);
      throw new AppError(`Failed to delete policy folder: ${error.message}`, 500);
    }
  }

  /**
   * Upload a license file to R2 (stored in licenses/ folder, not policies/)
   */
  static async uploadLicenseFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderName: string
  ): Promise<UploadedFile> {
    // Store in licenses/[FOLDER_NAME]/ NOT policies/
    const key = `licenses/${folderName}/${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);
      console.log(`✅ License file uploaded to R2: ${key}`);

      return {
        file_id: key, // Full path as file_id
        file_name: fileName,
        mime_type: mimeType,
        web_view_link: `/api/v1/licenses/files/${folderName}/${fileName}`,
        file_path: key,
      };
    } catch (error: any) {
      console.error('R2 license upload error:', error);
      throw new AppError(`Failed to upload license file to R2: ${error.message}`, 500);
    }
  }

  /**
   * Delete a license file from R2
   */
  static async deleteLicenseFile(fileId: string): Promise<void> {
    // fileId is the full path for license files (licenses/FOLDER/filename)
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
   * Check if a license file exists in R2
   */
  static async licenseFileExists(fileId: string): Promise<boolean> {
    // fileId is already the full path like "licenses/FOLDER/filename"
    try {
      const command = new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileId,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get license file metadata
   */
  static async getLicenseFileMetadata(
    fileId: string
  ): Promise<{ size: number; contentType: string; lastModified: Date }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileId,
      });

      const response = await s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new AppError('File not found', 404);
      }
      throw new AppError(`Failed to get file metadata: ${error.message}`, 500);
    }
  }

  /**
   * Get a signed download URL for license file (with Content-Disposition: attachment)
   */
  static async getLicenseDownloadUrl(
    fileId: string,
    fileName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileId,
        ResponseContentDisposition: `attachment; filename="${fileName}"`,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error: any) {
      console.error('R2 license download URL error:', error);
      throw new AppError(`Failed to generate download URL: ${error.message}`, 500);
    }
  }

  /**
   * Download a license file from R2
   */
  static async downloadLicenseFile(fileId: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileId,
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
   * Get file metadata (size, content type, etc.)
   */
  static async getFileMetadata(
    fileId: string
  ): Promise<{ size: number; contentType: string; lastModified: Date }> {
    const key = `policies/${fileId}`;

    try {
      const command = new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new AppError('File not found', 404);
      }
      throw new AppError(`Failed to get file metadata: ${error.message}`, 500);
    }
  }
}
