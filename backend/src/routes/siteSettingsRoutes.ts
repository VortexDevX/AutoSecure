import { Router } from 'express';
import {
  getSettings,
  toggleSite,
  updateMaintenanceMessage,
  uploadBrandingLogo,
  updateBranding,
  serveBrandingLogo,
} from '../controllers/siteSettingsController';
import { requireAuth, requireOwner } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Public route - serve logo (no auth required)
router.get('/branding/logo', serveBrandingLogo);

// All other routes require authentication
router.use(requireAuth);

// Get settings (any authenticated user)
router.get('/', getSettings);

// Owner-only routes
router.patch('/toggle', requireOwner, toggleSite);
router.patch('/message', requireOwner, updateMaintenanceMessage);
router.post('/branding/logo', requireOwner, upload.single('logo'), uploadBrandingLogo);
router.patch('/branding', requireOwner, updateBranding);

export default router;
