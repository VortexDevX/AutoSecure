import { Router } from 'express';
import { sendBackupEmail, getEmailLogs, getRecipientEmail } from '../controllers/emailController';
import { requireAuth } from '../middleware/authMiddleware';
import { emailRateLimiter } from '../middleware/rateLimitMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Apply auth to all email routes
router.use(requireAuth);

// Get recipient email (for frontend display)
router.get('/recipient', getRecipientEmail);

// Send backup email with attachments
router.post('/send-backup', emailRateLimiter, upload.array('attachments', 5), sendBackupEmail);

// Get email logs for a policy
router.get('/logs/:policyId', getEmailLogs);

export default router;
