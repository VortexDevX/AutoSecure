import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { User, SiteSettings } from '../models';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';

dotenv.config();

const initializeDatabase = async () => {
  try {
    await connectDatabase();

    console.log('\n🔧 Initializing database...\n');

    // 1. Create owner account (if not exists)
    const ownerEmail = process.env.OWNER_EMAIL || 'owner@autosecure.local';
    const ownerPassword = process.env.OWNER_PASSWORD || 'Owner@12345';

    let owner = await User.findOne({ email: ownerEmail });

    if (!owner) {
      const totpSecret = speakeasy.generateSecret({ length: 20 });
      const passwordHash = await bcrypt.hash(ownerPassword, 12);

      owner = await User.create({
        email: ownerEmail,
        password_hash: passwordHash,
        role: 'owner',
        totp_secret: totpSecret.base32,
        totp_enabled: false, // Will be enabled on first login
        totp_verified: false,
        active: true,
        full_name: 'System Owner',
      });

      console.log('✅ Owner account created');
      console.log(`   Email: ${ownerEmail}`);
      console.log(`   Password: ${ownerPassword}`);
      console.log(`   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!\n`);
      console.log(`   TOTP Secret: ${totpSecret.base32}`);
      console.log(`   (Scan QR code on first login)\n`);
    } else {
      console.log('ℹ️  Owner account already exists');
    }

    // 2. Create default SiteSettings with branding
    const existingSettings = await SiteSettings.findOne();
    if (!existingSettings) {
      await SiteSettings.create({
        site_enabled: true,
        maintenance_message:
          'Site is temporarily unavailable for maintenance. Please check back later.',
        branding: {
          company_name: 'AutoSecure',
          logo_path: 'storage/branding/logo.png',
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
          footer_text: '© 2025 AutoSecure. All rights reserved.',
        },
        updated_by: owner._id,
      });
      console.log('✅ Default SiteSettings created with branding');
    } else {
      // Update existing settings with branding if missing
      if (!existingSettings.branding || !existingSettings.branding.company_name) {
        existingSettings.branding = {
          company_name: 'AutoSecure',
          logo_path: 'storage/branding/logo.png',
          footer_text: '© 2025 AutoSecure. All rights reserved.',
        };
        existingSettings.updated_by = owner._id;
        await existingSettings.save();
        console.log('✅ Site settings updated with branding');
      } else {
        console.log('ℹ️  SiteSettings already exists with branding');
      }
    }

    console.log('\n✅ Database initialization complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initializeDatabase();
