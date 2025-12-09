import { Router } from 'express';
import {
  exportPolicies,
  getExportCount,
  exportLicenses,
  getExportLicenseCount,
} from '../controllers/exportController';
import { requireAuth } from '../middleware/authMiddleware';
import { exportRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Policy exports
router.post('/policies/count', getExportCount);
router.post('/policies', exportRateLimiter, exportPolicies);

// License exports
router.post('/licenses/count', getExportLicenseCount);
router.post('/licenses', exportRateLimiter, exportLicenses);

export default router;
