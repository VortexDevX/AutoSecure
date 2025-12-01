import { Router } from 'express';
import { exportPolicies, getExportCount } from '../controllers/exportController';
import { requireAuth } from '../middleware/authMiddleware';
import { exportRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// IMPORTANT: More specific route MUST come first
router.post('/policies/count', getExportCount); // Removed duplicate requireAuth
router.post('/policies', exportRateLimiter, exportPolicies);

export default router;
