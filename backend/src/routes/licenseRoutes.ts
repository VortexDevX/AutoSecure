import { Router } from 'express';
import {
  getLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  deleteLicense,
  getExpiringLicenses,
  deleteLicenseDocument,
} from '../controllers/licenseController';
import {
  getLicenseFile,
  getLicenseFileUrl,
  downloadLicenseFile,
} from '../controllers/licenseFileController';
import { requireAuth } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();

// Multer config for license documents
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG allowed.'));
    }
  },
});

// All routes require authentication
router.use(requireAuth);

// File routes (before :id routes to avoid conflicts)
router.get('/files/:folderName/:fileName', getLicenseFile);
router.get('/files/:folderName/:fileName/url', getLicenseFileUrl);
router.get('/files/:folderName/:fileName/download', downloadLicenseFile);

// Get expiring licenses (before :id route)
router.get('/expiring-soon', getExpiringLicenses);

// CRUD routes
router.get('/', getLicenses);
router.get('/:id', getLicenseById);
router.post('/', upload.fields([{ name: 'documents', maxCount: 3 }]), createLicense);
router.patch('/:id', upload.fields([{ name: 'documents', maxCount: 3 }]), updateLicense);
router.delete('/:id', deleteLicense);

// Delete individual document
router.delete('/:id/documents/:docIndex', deleteLicenseDocument);

export default router;
