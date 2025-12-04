import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { EmailTemplate, User } from '../models';

const LICENSE_EMAIL_TEMPLATE = {
  template_id: 'license_details',
  name: 'License Details Backup',
  subject: 'License Details: {{lic_no}} - {{customer_name}}',
  body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f0f4f8; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .info-grid { display: table; width: 100%; }
    .info-row { display: table-row; }
    .info-label { display: table-cell; padding: 10px 15px 10px 0; color: #6b7280; font-size: 14px; width: 40%; vertical-align: top; }
    .info-value { display: table-cell; padding: 10px 0; color: #1f2937; font-weight: 500; font-size: 14px; }
    .highlight-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .highlight-box .label { color: #0369a1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
    .highlight-box .value { color: #0c4a6e; font-size: 24px; font-weight: 700; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 5px 0; color: #6b7280; font-size: 12px; }
    .footer .company { font-weight: 600; color: #374151; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 License Record Details</h1>
    </div>
    
    <div class="content">
      <div class="highlight-box">
        <div class="label">License Number</div>
        <div class="value">{{lic_no}}</div>
      </div>

      <div class="section">
        <div class="section-title">📋 License Information</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Application No</div>
            <div class="info-value">{{application_no}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Expiry Date</div>
            <div class="info-value">{{expiry_date}}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">👤 Customer Information</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Name</div>
            <div class="info-value">{{customer_name}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">{{dob}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Mobile No</div>
            <div class="info-value">{{mobile_no}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Aadhar No</div>
            <div class="info-value">{{aadhar_no}}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p class="company">{{company_name}}</p>
      <p>{{company_address}}</p>
      <p>📞 {{company_phone}} | ✉️ {{company_email}}</p>
      <p style="margin-top: 15px; color: #9ca3af;">This is an automated backup email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`,
  active: true,
};

async function seedLicenseEmailTemplate() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find owner user to use as created_by/updated_by
    const ownerUser = await User.findOne({ role: 'owner' });
    if (!ownerUser) {
      throw new Error('No owner user found. Please run db:init first to create an owner.');
    }

    console.log(`👤 Using owner user: ${ownerUser.email}`);

    // Check if template already exists
    const existing = await EmailTemplate.findOne({ template_id: 'license_details' });

    const templateData = {
      ...LICENSE_EMAIL_TEMPLATE,
      created_by: ownerUser._id,
      updated_by: ownerUser._id,
    };

    if (existing) {
      console.log('📧 License email template already exists, updating...');
      await EmailTemplate.updateOne(
        { template_id: 'license_details' },
        {
          $set: {
            name: templateData.name,
            subject: templateData.subject,
            body_html: templateData.body_html,
            active: templateData.active,
            updated_by: ownerUser._id,
          },
        }
      );
      console.log('✅ License email template updated!');
    } else {
      console.log('📧 Creating license email template...');
      await EmailTemplate.create(templateData);
      console.log('✅ License email template created!');
    }

    console.log('\n📋 Template Details:');
    console.log(`   ID: ${LICENSE_EMAIL_TEMPLATE.template_id}`);
    console.log(`   Name: ${LICENSE_EMAIL_TEMPLATE.name}`);
    console.log(`   Subject: ${LICENSE_EMAIL_TEMPLATE.subject}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedLicenseEmailTemplate();
