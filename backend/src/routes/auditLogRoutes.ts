import { Router } from 'express';
import { getAuditLogs, getAuditLogStats, getAuditLogById } from '../controllers/auditLogController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// All audit log routes require admin or owner
router.use(requireAuth, requireAdmin);

// Get audit logs with filters and pagination
router.get('/', getAuditLogs);

// Get audit log statistics
router.get('/stats', getAuditLogStats);

// Get single audit log by ID
router.get('/:id', getAuditLogById);

export default router;
