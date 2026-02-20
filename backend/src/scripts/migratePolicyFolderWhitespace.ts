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
 * Fix policies where drive_folder_id has leading/trailing whitespace.
 *
 * Usage:
 *   npx tsx src/scripts/migratePolicyFolderWhitespace.ts --dry-run
 *   npx tsx src/scripts/migratePolicyFolderWhitespace.ts --execute
 *   npx tsx src/scripts/migratePolicyFolderWhitespace.ts --execute --delete-old
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'autosecure-files';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const deleteOld = args.includes('--delete-old');

type AnyPolicy = any;

async function listKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const res = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );

    for (const item of res.Contents || []) {
      if (item.Key) keys.push(item.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return keys;
}

async function keyExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

function updateFileRefs(policy: AnyPolicy, oldFolder: string, newFolder: string): void {
  const oldPrefix = `${oldFolder}/`;
  const newPrefix = `${newFolder}/`;

  const patchFile = (file: any) => {
    if (!file) return;
    if (typeof file.file_id === 'string') {
      file.file_id = file.file_id.replace(oldPrefix, newPrefix);
    }
    if (typeof file.web_view_link === 'string') {
      file.web_view_link = file.web_view_link.replace(`/${oldFolder}/`, `/${newFolder}/`);
    }
  };

  patchFile(policy.adh_file);
  patchFile(policy.pan_file);

  if (Array.isArray(policy.other_documents)) {
    for (const doc of policy.other_documents) patchFile(doc);
  }
}

async function migrateOne(policy: AnyPolicy): Promise<void> {
  const oldFolder = String(policy.drive_folder_id || '');
  const trimmedFolder = oldFolder.trim();
  const fallback = String(policy.policy_no || '').trim();
  const newFolder = trimmedFolder || fallback;

  if (!newFolder || oldFolder === newFolder) return;

  const oldPrefix = `policies/${oldFolder}/`;
  const keys = await listKeys(oldPrefix);

  console.log(`\nPolicy ${policy._id}`);
  console.log(`  old folder: "${oldFolder}"`);
  console.log(`  new folder: "${newFolder}"`);
  console.log(`  files found: ${keys.length}`);

  if (!isExecute) return;

  for (const sourceKey of keys) {
    const fileName = sourceKey.slice(oldPrefix.length);
    const destKey = `policies/${newFolder}/${fileName}`;

    await s3Client.send(
      new CopyObjectCommand({
        Bucket: R2_BUCKET_NAME,
        CopySource: `${R2_BUCKET_NAME}/${sourceKey}`,
        Key: destKey,
      })
    );

    const ok = await keyExists(destKey);
    if (!ok) {
      throw new Error(`copy verification failed: ${destKey}`);
    }
  }

  updateFileRefs(policy, oldFolder, newFolder);
  policy.drive_folder_id = newFolder;
  if (typeof policy.policy_no === 'string') {
    policy.policy_no = policy.policy_no.trim();
  }
  await policy.save();

  if (deleteOld) {
    for (const key of keys) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    }
  }
}

async function run(): Promise<void> {
  console.log('\n=== Policy Folder Whitespace Migration ===');
  console.log(`Mode: ${isExecute ? 'EXECUTE' : 'DRY-RUN'}`);
  if (isExecute && deleteOld) {
    console.log('Old keys will be deleted after copy+verify.');
  }

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing R2 credentials in environment.');
  }

  await connectDatabase();

  const policies = await Policy.find({
    drive_folder_id: { $regex: /^\s+|\s+$/ },
  });

  console.log(`Policies to process: ${policies.length}`);

  for (const policy of policies) {
    await migrateOne(policy);
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('\nMigration failed:', err);
  process.exit(1);
});

