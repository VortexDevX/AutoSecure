import { Request, Response, NextFunction } from 'express';
import { SiteSettings } from '../models/SiteSettings';
import { JWTService } from '../services/jwtService';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Extract token from request headers or cookies
 */
const extractToken = (req: Request): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Middleware: Check if site is enabled
 * Only owner can bypass when site is disabled
 */
export const checkSiteEnabled = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get site settings
    let settings = await SiteSettings.findOne();

    // Create default settings if not exists
    if (!settings) {
      settings = await SiteSettings.create({
        site_enabled: true,
        maintenance_message: 'Site is temporarily unavailable for maintenance.',
      });
    }

    // If site is enabled, allow all
    if (settings.site_enabled) {
      return next();
    }

    // Site is disabled - check if user is owner
    // We need to verify the token here since req.user is not populated yet
    const token = extractToken(req);

    if (token) {
      try {
        const payload = JWTService.verifyAccessToken(token);

        // If user is owner, allow access
        if (payload.role === 'owner') {
          return next();
        }
      } catch (error) {
        // Invalid/expired token - will be handled by auth middleware
        // For now, show maintenance page
      }
    }

    // Site disabled and user is not owner (or not authenticated)
    return res.status(503).json({
      status: 'error',
      message: 'Site temporarily unavailable',
      maintenance_message: settings.maintenance_message,
    });
  }
);
