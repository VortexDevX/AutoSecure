import { Router } from 'express';
import {
  downloadFile,
  forceDownloadFile,
  getFileUrl,
  deletePolicyFile,
} from '../controllers/fileController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// File viewing/downloading
router.get('/:policyNo/:fileName', downloadFile);
router.get('/:policyNo/:fileName/download', forceDownloadFile);
router.get('/:policyNo/:fileName/url', getFileUrl); // New: Get signed URL

export default router;
