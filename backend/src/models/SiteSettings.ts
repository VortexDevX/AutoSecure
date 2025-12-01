import { Schema, model, Document, Types } from 'mongoose';

export interface IBranding {
  company_name: string;
  logo_path?: string;
  footer_text: string;
}

export interface ISiteSettings extends Document {
  _id: Types.ObjectId;
  site_enabled: boolean;
  maintenance_message?: string;
  branding: IBranding;
  updated_by: Types.ObjectId;
  updatedAt: Date;
}

const BrandingSchema = new Schema<IBranding>(
  {
    company_name: {
      type: String,
      default: 'AutoSecure',
    },
    logo_path: {
      type: String,
    },
    footer_text: {
      type: String,
      default: '© 2025 AutoSecure. All rights reserved.',
    },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    site_enabled: {
      type: Boolean,
      default: true,
    },
    maintenance_message: {
      type: String,
      default: 'Site is temporarily unavailable for maintenance. Please check back later.',
    },
    branding: {
      type: BrandingSchema,
      default: () => ({}),
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

export const SiteSettings = model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
