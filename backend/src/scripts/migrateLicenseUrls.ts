import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LicenseRecord } from '../models/LicenseRecord';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  const licenses = await LicenseRecord.find({
    'documents.web_view_link': { $regex: '^/api/v1/licenses/files/' },
  });

  console.log(`Found ${licenses.length} licenses to update`);

  for (const license of licenses) {
    let updated = false;

    license.documents = license.documents.map((doc) => {
      if (doc.web_view_link.startsWith('/api/v1/licenses/files/')) {
        updated = true;
        return {
          ...doc,
          web_view_link: `${BACKEND_URL}${doc.web_view_link}`,
        };
      }
      return doc;
    }) as any;

    if (updated) {
      await license.save();
      console.log(`Updated license: ${license.lic_no}`);
    }
  }

  console.log('Migration complete');
  await mongoose.disconnect();
}

migrate().catch(console.error);
