import { Router } from 'express';
import {
  sendBackupEmail,
  sendLicenseBackupEmail,
  getEmailLogs,
  getLicenseEmailLogs,
  getRecipientEmail,
} from '../controllers/emailController';
import { requireAuth } from '../middleware/authMiddleware';
import { emailRateLimiter } from '../middleware/rateLimitMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Apply auth to all email routes
router.use(requireAuth);

// Get recipient email (for frontend display)
router.get('/recipient', getRecipientEmail);

// Policy email routes
router.post('/send-backup', emailRateLimiter, upload.array('attachments', 5), sendBackupEmail);
router.get('/logs/:policyId', getEmailLogs);

// License email routes
router.post(
  '/send-license-backup',
  emailRateLimiter,
  upload.array('attachments', 5),
  sendLicenseBackupEmail
);
router.get('/license-logs/:licenseId', getLicenseEmailLogs);

export default router;
