import { Router } from 'express';
import {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPolicies,
} from '../controllers/policyController';
import { requireAuth } from '../middleware/authMiddleware';
import { uploadPolicyFiles } from '../middleware/uploadMiddleware';
import { uploadRateLimiter } from '../middleware/rateLimitMiddleware';
import { deletePolicyFile } from '../controllers/fileController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get('/', getPolicies);
router.get('/:id', getPolicy);
router.post('/', uploadRateLimiter, uploadPolicyFiles, createPolicy);
router.patch('/:id', uploadRateLimiter, uploadPolicyFiles, updatePolicy);
router.delete('/:id', deletePolicy);

// Delete file routes - two separate routes instead of optional param
router.delete('/:id/files/:fileType', deletePolicyFile);
router.delete('/:id/files/:fileType/:fileIndex', deletePolicyFile);

export default router;
