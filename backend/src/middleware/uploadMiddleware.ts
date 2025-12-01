import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// Multer storage configuration (memory storage)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('📎 Multer fileFilter called for:', file.fieldname, file.originalname);

  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(`Invalid file type: ${file.mimetype}. Allowed types: PDF, JPG, JPEG, PNG`)
    );
  }
};

// Multer upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

// Debug wrapper
const uploadWithLogging = (middleware: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('🔧 Multer middleware called');
    console.log('   Content-Type:', req.headers['content-type']);

    middleware(req, res, (err: any) => {
      if (err) {
        console.error('❌ Multer error:', err);
        return next(err);
      }

      console.log('✅ Multer processed successfully');
      console.log('   Body fields:', req.body ? Object.keys(req.body) : []);
      console.log('   Files:', req.files ? Object.keys(req.files) : []);
      next();
    });
  };
};

// ✅ UPDATED: Middleware for policy files (Aadhaar + PAN + up to 5 other documents)
export const uploadPolicyFiles = uploadWithLogging(
  upload.fields([
    { name: 'adh_file', maxCount: 1 },
    { name: 'pan_file', maxCount: 1 },
    { name: 'other_doc_0', maxCount: 1 },
    { name: 'other_doc_1', maxCount: 1 },
    { name: 'other_doc_2', maxCount: 1 },
    { name: 'other_doc_3', maxCount: 1 },
    { name: 'other_doc_4', maxCount: 1 },
  ])
);
