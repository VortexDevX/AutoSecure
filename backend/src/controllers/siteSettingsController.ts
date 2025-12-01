import { Request, Response } from 'express';
import { SiteSettings } from '../models/SiteSettings';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ValidationError } from '../utils/errors';
import { Types } from 'mongoose';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

/**
 * GET /api/v1/settings
 * Get current site settings
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await SiteSettings.findOne();

  // Create default if not exists
  if (!settings) {
    settings = await SiteSettings.create({
      site_enabled: true,
      maintenance_message: 'Site is temporarily unavailable for maintenance.',
      branding: {
        company_name: 'AutoSecure',
        logo_path: '',
        footer_text: '© 2025 AutoSecure. All rights reserved.',
      },
    });
  }

  res.json({
    status: 'success',
    data: {
      settings: {
        site_enabled: settings.site_enabled,
        maintenance_message: settings.maintenance_message,
        branding: settings.branding,
        updated_at: settings.updatedAt,
      },
    },
  });
});

/**
 * PATCH /api/v1/settings/toggle
 * Toggle site enabled/disabled (Owner only)
 */
export const toggleSite = asyncHandler(async (req: Request, res: Response) => {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    throw new ValidationError('enabled must be a boolean');
  }

  let settings = await SiteSettings.findOne();

  if (!settings) {
    settings = await SiteSettings.create({
      site_enabled: enabled,
      updated_by: new Types.ObjectId(req.user!.userId),
    });
  } else {
    settings.site_enabled = enabled;
    settings.updated_by = new Types.ObjectId(req.user!.userId);
    await settings.save();
  }

  // Audit log
  await AuditService.logSiteToggle(req.user!.userId, enabled, settings.maintenance_message);

  res.json({
    status: 'success',
    message: `Site ${enabled ? 'enabled' : 'disabled'} successfully`,
    data: {
      settings: {
        site_enabled: settings.site_enabled,
        maintenance_message: settings.maintenance_message,
      },
    },
  });
});

/**
 * PATCH /api/v1/settings/message
 * Update maintenance message (Owner only)
 */
export const updateMaintenanceMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    throw new ValidationError('message is required and must be a string');
  }

  let settings = await SiteSettings.findOne();

  if (!settings) {
    settings = await SiteSettings.create({
      site_enabled: true,
      maintenance_message: message,
      updated_by: new Types.ObjectId(req.user!.userId),
    });
  } else {
    settings.maintenance_message = message;
    settings.updated_by = new Types.ObjectId(req.user!.userId);
    await settings.save();
  }

  res.json({
    status: 'success',
    message: 'Maintenance message updated successfully',
    data: {
      settings: {
        site_enabled: settings.site_enabled,
        maintenance_message: settings.maintenance_message,
      },
    },
  });
});

/**
 * GET /api/v1/settings/branding/logo
 * Serve the branding logo (public)
 */
export const serveBrandingLogo = asyncHandler(async (req: Request, res: Response) => {
  const settings = await SiteSettings.findOne();
  const storagePath = process.env.FILE_STORAGE_PATH || './storage';

  // ✅ Add CORS headers for cross-origin image loading
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Try to get logo from settings first
  if (settings?.branding?.logo_path) {
    const logoPath = path.join(storagePath, 'branding', path.basename(settings.branding.logo_path));

    if (fsSync.existsSync(logoPath)) {
      const ext = path.extname(logoPath).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
      };

      res.setHeader('Content-Type', contentTypes[ext] || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(path.resolve(logoPath));
    }
  }

  // Try default logo
  const defaultLogoPath = path.join(storagePath, 'branding', 'logo.png');

  if (fsSync.existsSync(defaultLogoPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(path.resolve(defaultLogoPath));
  }

  throw new AppError('Logo not found', 404);
});

/**
 * Upload branding logo
 * POST /api/v1/settings/branding/logo
 */
export const uploadBrandingLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No logo file uploaded', 400);
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new AppError('Invalid file type. Only PNG and JPG are allowed.', 400);
  }

  // Validate file size (max 2MB for logo)
  if (req.file.size > 2 * 1024 * 1024) {
    throw new AppError('Logo file too large. Maximum size is 2MB.', 400);
  }

  const brandingFolder = path.join(process.env.FILE_STORAGE_PATH || './storage', 'branding');

  // Ensure folder exists
  await fs.mkdir(brandingFolder, { recursive: true });

  // Delete old logo if exists
  try {
    const files = await fs.readdir(brandingFolder);
    for (const file of files) {
      if (file.startsWith('logo.')) {
        await fs.unlink(path.join(brandingFolder, file));
      }
    }
  } catch (error) {
    // Ignore errors when deleting old logo
  }

  // Save logo
  const ext = path.extname(req.file.originalname) || '.png';
  const fileName = `logo${ext}`;
  const logoPath = path.join(brandingFolder, fileName);
  await fs.writeFile(logoPath, req.file.buffer);

  // Update site settings
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({
      branding: {
        logo_path: `branding/${fileName}`,
      },
      updated_by: new Types.ObjectId(req.user!.userId),
    });
  } else {
    settings.branding.logo_path = `branding/${fileName}`;
    settings.updated_by = new Types.ObjectId(req.user!.userId);
    await settings.save();
  }

  // Audit log
  await AuditService.log({
    user_id: req.user!.userId,
    action: 'update',
    resource_type: 'site_settings',
    resource_id: settings._id.toString(),
    details: { action: 'logo_upload', file_name: fileName },
  });

  res.json({
    success: true,
    message: 'Logo uploaded successfully',
    data: {
      logo_path: `branding/${fileName}`,
    },
  });
});

/**
 * Update branding settings
 * PATCH /api/v1/settings/branding
 */
export const updateBranding = asyncHandler(async (req: Request, res: Response) => {
  const { company_name, footer_text } = req.body;

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({
      branding: {},
      updated_by: new Types.ObjectId(req.user!.userId),
    });
  }

  // Store old branding for audit log
  const oldBranding = {
    company_name: settings.branding.company_name,
    footer_text: settings.branding.footer_text,
  };

  if (company_name !== undefined) settings.branding.company_name = company_name;
  if (footer_text !== undefined) settings.branding.footer_text = footer_text;

  settings.updated_by = new Types.ObjectId(req.user!.userId);
  await settings.save();

  // New branding for audit log
  const newBranding = {
    company_name: settings.branding.company_name,
    footer_text: settings.branding.footer_text,
  };

  // Audit log
  await AuditService.log({
    user_id: req.user!.userId,
    action: 'update',
    resource_type: 'site_settings',
    resource_id: settings._id.toString(),
    details: {
      action: 'branding_update',
      old: oldBranding,
      new: newBranding,
    },
  });

  res.json({
    success: true,
    message: 'Branding settings updated successfully',
    data: {
      branding: settings.branding,
    },
  });
});
