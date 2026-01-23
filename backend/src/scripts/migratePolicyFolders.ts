import { connectDatabase } from '../config/database';
import { Policy } from '../models';
import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * Migration Script: Fix Policy Folders with "/" Characters
 *
 * Purpose: Migrate policies where policy_no contains "/" to use "-" instead.
 * This fixes the issue where "/" created unintended subfolder structures in R2.
 *
 * SAFETY FEATURES:
 * 1. DRY-RUN MODE (default) - Shows what would change without making changes
 * 2. Copies files BEFORE deleting
 * 3. Verifies copy success before updating DB
 * 4. Detailed logging of every operation
 * 5. Rollback information logged in case manual intervention needed
 *
 * Usage:
 *   npx tsx src/scripts/migratePolicyFolders.ts --dry-run    (preview changes)
 *   npx tsx src/scripts/migratePolicyFolders.ts --execute    (run migration)
 */

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'autosecure-files';
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

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');
const forceDelete = args.includes('--force-delete'); // Only delete old files if this flag is set

interface MigrationResult {
  policyId: string;
  oldPolicyNo: string;
  newPolicyNo: string;
  filesFound: string[];
  filesCopied: string[];
  dbUpdated: boolean;
  filesDeleted: string[];
  error?: string;
}

/**
 * Sanitize policy number - replace "/" with "-"
 */
function sanitizePolicyNo(policyNo: string): string {
  // Replace all invalid folder characters with "-"
  return policyNo.replace(/[/\\:*?"<>|]/g, '-');
}

/**
 * List all files in a folder prefix
 */
async function listFilesInFolder(folderPrefix: string): Promise<string[]> {
  const prefix = `policies/${folderPrefix}/`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map((obj) => obj.Key!) || [];
  } catch (error) {
    console.error(`  ⚠️  Failed to list files in ${prefix}:`, error);
    return [];
  }
}

/**
 * Check if a file exists
 */
async function fileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy a file from one location to another
 */
async function copyFile(sourceKey: string, destKey: string): Promise<boolean> {
  try {
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: R2_BUCKET_NAME,
        CopySource: `${R2_BUCKET_NAME}/${sourceKey}`,
        Key: destKey,
      })
    );
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to copy ${sourceKey} → ${destKey}:`, error);
    return false;
  }
}

/**
 * Delete a file
 */
async function deleteFile(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to delete ${key}:`, error);
    return false;
  }
}

/**
 * Update file references in policy document
 */
function updateFileReferences(policy: any, oldFolderId: string, newFolderId: string): void {
  // Update adh_file reference
  if (policy.adh_file?.file_id) {
    policy.adh_file.file_id = policy.adh_file.file_id.replace(oldFolderId, newFolderId);
    policy.adh_file.web_view_link = policy.adh_file.web_view_link?.replace(
      oldFolderId,
      newFolderId
    );
  }

  // Update pan_file reference
  if (policy.pan_file?.file_id) {
    policy.pan_file.file_id = policy.pan_file.file_id.replace(oldFolderId, newFolderId);
    policy.pan_file.web_view_link = policy.pan_file.web_view_link?.replace(
      oldFolderId,
      newFolderId
    );
  }

  // Update other_documents references
  if (policy.other_documents && Array.isArray(policy.other_documents)) {
    for (const doc of policy.other_documents) {
      if (doc.file_id) {
        doc.file_id = doc.file_id.replace(oldFolderId, newFolderId);
        doc.web_view_link = doc.web_view_link?.replace(oldFolderId, newFolderId);
      }
    }
  }
}

/**
 * Migrate a single policy
 */
async function migratePolicy(policy: any, isDryRun: boolean): Promise<MigrationResult> {
  const result: MigrationResult = {
    policyId: policy._id.toString(),
    oldPolicyNo: policy.policy_no,
    newPolicyNo: sanitizePolicyNo(policy.policy_no),
    filesFound: [],
    filesCopied: [],
    dbUpdated: false,
    filesDeleted: [],
  };

  const oldFolderId = policy.drive_folder_id;
  const newFolderId = sanitizePolicyNo(oldFolderId);

  console.log(`\n📋 Policy: ${result.oldPolicyNo} → ${result.newPolicyNo}`);
  console.log(`   ID: ${result.policyId}`);
  console.log(`   Folder: ${oldFolderId} → ${newFolderId}`);

  // Step 1: List files in old folder
  const oldFiles = await listFilesInFolder(oldFolderId);
  result.filesFound = oldFiles;

  if (oldFiles.length === 0) {
    console.log(`   📂 No files found in old folder`);
  } else {
    console.log(`   📂 Found ${oldFiles.length} files:`);
    for (const file of oldFiles) {
      console.log(`      - ${file}`);
    }
  }

  if (isDryRun) {
    console.log(`   🔍 DRY RUN - No changes made`);
    return result;
  }

  // Step 2: Copy files to new location
  console.log(`   📤 Copying files to new location...`);
  for (const sourceKey of oldFiles) {
    const fileName = sourceKey.split('/').pop()!;
    const destKey = `policies/${newFolderId}/${fileName}`;

    console.log(`      Copying: ${sourceKey} → ${destKey}`);
    const success = await copyFile(sourceKey, destKey);

    if (success) {
      // Verify the copy
      const exists = await fileExists(destKey);
      if (exists) {
        result.filesCopied.push(destKey);
        console.log(`      ✅ Copied and verified`);
      } else {
        result.error = `File copy verification failed for ${destKey}`;
        console.log(`      ❌ Copy verification failed!`);
        return result;
      }
    } else {
      result.error = `Failed to copy ${sourceKey}`;
      return result;
    }
  }

  // Step 3: Update database
  console.log(`   💾 Updating database...`);
  try {
    // Update file references
    updateFileReferences(policy, oldFolderId, newFolderId);

    // Update policy_no and drive_folder_id
    policy.policy_no = result.newPolicyNo;
    policy.drive_folder_id = newFolderId;

    await policy.save();
    result.dbUpdated = true;
    console.log(`      ✅ Database updated`);
  } catch (error: any) {
    result.error = `Database update failed: ${error.message}`;
    console.log(`      ❌ Database update failed: ${error.message}`);
    console.log(`      ⚠️  Files were copied but DB not updated. Manual cleanup needed.`);
    console.log(`      📝 Rollback: Delete files in policies/${newFolderId}/`);
    return result;
  }

  // Step 4: Delete old files (only if forceDelete is set)
  if (forceDelete && result.dbUpdated && result.filesCopied.length === oldFiles.length) {
    console.log(`   🗑️  Deleting old files...`);
    for (const oldKey of oldFiles) {
      const deleted = await deleteFile(oldKey);
      if (deleted) {
        result.filesDeleted.push(oldKey);
        console.log(`      ✅ Deleted: ${oldKey}`);
      } else {
        console.log(`      ⚠️  Failed to delete: ${oldKey} (manual cleanup needed)`);
      }
    }
  } else if (!forceDelete && oldFiles.length > 0) {
    console.log(`   ⏸️  Old files NOT deleted (run with --force-delete to remove)`);
    console.log(`   📝 Old files location: policies/${oldFolderId}/`);
  }

  return result;
}

/**
 * Main migration function
 */
async function migratePolicyFolders() {
  console.log('\n' + '='.repeat(70));
  console.log('  POLICY FOLDER MIGRATION SCRIPT');
  console.log('  Fix policies with "/" in policy_no');
  console.log('='.repeat(70));

  if (isDryRun) {
    console.log('\n🔍 MODE: DRY RUN (no changes will be made)');
    console.log('   To execute migration, run with: --execute');
  } else {
    console.log('\n⚡ MODE: EXECUTE (changes will be made!)');
    if (forceDelete) {
      console.log('   ⚠️  OLD FILES WILL BE DELETED (--force-delete is set)');
    } else {
      console.log('   📌 Old files will be KEPT (run with --force-delete to remove them)');
    }
  }

  try {
    // Connect to database
    await connectDatabase();
    console.log('\n✅ Connected to database\n');

    // Check R2 configuration
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.error('❌ R2 credentials not configured. Check environment variables.');
      process.exit(1);
    }
    console.log('✅ R2 credentials configured\n');

    // Find affected policies
    console.log('🔍 Searching for policies with "/" in drive_folder_id...\n');
    const affectedPolicies = await Policy.find({
      $or: [{ drive_folder_id: { $regex: '/' } }, { policy_no: { $regex: '/' } }],
    });

    console.log(`📊 Found ${affectedPolicies.length} affected policies\n`);

    if (affectedPolicies.length === 0) {
      console.log('✅ No policies need migration!\n');
      process.exit(0);
    }

    // List affected policies
    console.log('Affected policies:');
    console.log('-'.repeat(70));
    for (const policy of affectedPolicies) {
      console.log(`  ${policy.policy_no} (ID: ${policy._id})`);
    }
    console.log('-'.repeat(70));

    // Process each policy
    const results: MigrationResult[] = [];

    for (const policy of affectedPolicies) {
      const result = await migratePolicy(policy, isDryRun);
      results.push(result);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('  MIGRATION SUMMARY');
    console.log('='.repeat(70));

    const successful = results.filter((r) => !r.error && (isDryRun || r.dbUpdated));
    const failed = results.filter((r) => r.error);

    console.log(`\n📊 Total policies processed: ${results.length}`);
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log('\n❌ FAILED POLICIES:');
      for (const f of failed) {
        console.log(`   - ${f.oldPolicyNo}: ${f.error}`);
      }
    }

    if (isDryRun) {
      console.log('\n🔍 This was a DRY RUN. No changes were made.');
      console.log('   To execute the migration, run:');
      console.log('   npx tsx src/scripts/migratePolicyFolders.ts --execute\n');
    } else {
      const totalFilesCopied = results.reduce((sum, r) => sum + r.filesCopied.length, 0);
      const totalFilesDeleted = results.reduce((sum, r) => sum + r.filesDeleted.length, 0);

      console.log(`\n📁 Files copied: ${totalFilesCopied}`);
      console.log(`🗑️  Files deleted: ${totalFilesDeleted}`);

      if (!forceDelete) {
        console.log('\n⚠️  Old files were NOT deleted. They still exist in R2.');
        console.log('   To delete old files, run with --force-delete flag.');
        console.log('   Or manually delete them from R2 after verifying the migration.\n');
      }
    }

    console.log('='.repeat(70) + '\n');

    process.exit(failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// Run the migration
migratePolicyFolders();
