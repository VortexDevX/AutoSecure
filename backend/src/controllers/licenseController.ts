import { Request, Response } from 'express';
import { LicenseRecord } from '../models/LicenseRecord';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';
import { FileStorageService } from '../services/fileStorageService';

// Backend URL for generating file links
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Get all license records (with pagination, filters)
 * GET /api/v1/licenses
 */
export const getLicenses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const search = req.query.search as string;
  const approved = req.query.approved as string;
  const expiringSoon = req.query.expiring_soon as string;
  const facelessType = req.query.faceless_type as string;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { lic_no: { $regex: search, $options: 'i' } },
      { customer_name: { $regex: search, $options: 'i' } },
      { mobile_no: { $regex: search, $options: 'i' } },
      { aadhar_no: { $regex: search, $options: 'i' } },
      { application_no: { $regex: search, $options: 'i' } },
    ];
  }

  if (approved !== undefined && approved !== '') {
    query.approved = approved === 'true';
  }

  if (facelessType && facelessType !== '') {
    query.faceless_type = facelessType.toLowerCase();
  }

  if (expiringSoon === 'true') {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    query.expiry_date = { $gte: now, $lte: ninetyDaysFromNow };
  }

  const [licenses, total] = await Promise.all([
    LicenseRecord.find(query)
      .populate('created_by', 'email full_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LicenseRecord.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      licenses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Get single license record
 * GET /api/v1/licenses/:id
 */
export const getLicenseById = asyncHandler(async (req: Request, res: Response) => {
  const license = await LicenseRecord.findById(req.params.id).populate(
    'created_by',
    'email full_name'
  );

  if (!license) {
    throw new AppError('License record not found', 404);
  }

  res.json({
    success: true,
    data: { license },
  });
});

/**
 * Helper to safely get string value and uppercase it
 */
function getUppercaseString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value).toUpperCase();
}

/**
 * Helper to safely parse number
 */
function parseNumber(value: unknown, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === '') return defaultValue;
  const num = parseFloat(String(value));
  return isNaN(num) ? defaultValue : num;
}

/**
 * Helper to safely parse boolean
 */
function parseBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
}

/**
 * Helper to normalize faceless_type to lowercase
 */
function normalizeFacelessType(value: unknown): 'faceless' | 'non-faceless' | 'reminder' {
  if (!value) return 'non-faceless';
  const normalized = String(value).toLowerCase();
  if (normalized === 'faceless' || normalized === 'non-faceless' || normalized === 'reminder') {
    return normalized;
  }
  return 'non-faceless';
}

/**
 * Helper to sanitize license number for folder name
 */
function sanitizeFolderName(licNo: string): string {
  return licNo.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
}

/**
 * Helper to generate unique filename (add suffix if file exists)
 */
function generateFileName(label: string, ext: string, existingNames: string[]): string {
  const safeLabel = label.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  let fileName = `${safeLabel}.${ext}`;
  let counter = 1;

  while (existingNames.includes(fileName)) {
    fileName = `${safeLabel}_${counter}.${ext}`;
    counter++;
  }

  return fileName;
}

/**
 * Create new license record
 * POST /api/v1/licenses
 */
export const createLicense = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const body = req.body;

  if (!body.lic_no) {
    throw new AppError('License number is required', 400);
  }
  if (!body.expiry_date) {
    throw new AppError('Expiry date is required', 400);
  }

  const fee = parseNumber(body.fee, 0);
  const agent_fee = parseNumber(body.agent_fee, 0);
  const customer_payment = parseNumber(body.customer_payment, 0);
  const profit = fee - agent_fee - customer_payment;

  const licNo = getUppercaseString(body.lic_no)!;
  const folderName = sanitizeFolderName(licNo);

  const licenseData: Record<string, unknown> = {
    lic_no: licNo,
    application_no: getUppercaseString(body.application_no),
    expiry_date: new Date(body.expiry_date),
    customer_name: getUppercaseString(body.customer_name),
    customer_address: getUppercaseString(body.customer_address),
    dob: body.dob ? new Date(body.dob) : undefined,
    mobile_no: body.mobile_no || undefined,
    aadhar_no: body.aadhar_no || undefined,
    reference: getUppercaseString(body.reference),
    reference_mobile_no: body.reference_mobile_no || undefined,
    fee,
    agent_fee,
    customer_payment,
    profit,
    work_process: getUppercaseString(body.work_process),
    approved: parseBoolean(body.approved, false),
    faceless_type: normalizeFacelessType(body.faceless_type),
    created_by: req.user!.userId,
    documents: [],
  };

  const license = await LicenseRecord.create(licenseData);

  if (files && files.documents && files.documents.length > 0) {
    let docLabels: string[] = [];
    if (body.document_labels) {
      try {
        docLabels =
          typeof body.document_labels === 'string'
            ? JSON.parse(body.document_labels)
            : body.document_labels;
      } catch (e) {
        console.warn('Failed to parse document_labels:', e);
      }
    }

    const uploadedFileNames: string[] = [];
    const uploadedDocs = await Promise.all(
      files.documents.slice(0, 3).map(async (file, index) => {
        const label = docLabels[index] || `Document ${index + 1}`;
        const ext = file.originalname.split('.').pop()?.toLowerCase() || 'pdf';
        const fileName = generateFileName(label, ext, uploadedFileNames);
        uploadedFileNames.push(fileName);

        const result = await FileStorageService.uploadLicenseFile(
          file.buffer,
          fileName,
          file.mimetype,
          folderName
        );

        return {
          file_id: result.file_id,
          file_name: result.file_name,
          original_name: file.originalname,
          label: label.toUpperCase(),
          mime_type: file.mimetype,
          web_view_link: `/api/v1/licenses/files/${folderName}/${fileName}`,
          uploaded_at: new Date(),
        };
      })
    );

    license.documents = uploadedDocs as any;
    await license.save();
  }

  await AuditService.log({
    user_id: req.user!.userId,
    action: 'create',
    resource_type: 'license',
    resource_id: license._id.toString(),
    details: { lic_no: license.lic_no },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    data: { license },
  });
});

/**
 * Update license record
 * PATCH /api/v1/licenses/:id
 */
export const updateLicense = asyncHandler(async (req: Request, res: Response) => {
  const license = await LicenseRecord.findById(req.params.id);

  if (!license) {
    throw new AppError('License record not found', 404);
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const body = req.body;

  if (body.lic_no) license.lic_no = getUppercaseString(body.lic_no)!;
  if (body.application_no !== undefined)
    license.application_no = getUppercaseString(body.application_no);
  if (body.expiry_date) license.expiry_date = new Date(body.expiry_date);
  if (body.customer_name !== undefined)
    license.customer_name = getUppercaseString(body.customer_name);
  if (body.customer_address !== undefined)
    license.customer_address = getUppercaseString(body.customer_address);
  if (body.dob !== undefined) license.dob = body.dob ? new Date(body.dob) : undefined;
  if (body.mobile_no !== undefined) license.mobile_no = body.mobile_no || undefined;
  if (body.aadhar_no !== undefined) license.aadhar_no = body.aadhar_no || undefined;
  if (body.reference !== undefined) license.reference = getUppercaseString(body.reference);
  if (body.reference_mobile_no !== undefined)
    license.reference_mobile_no = body.reference_mobile_no || undefined;
  if (body.work_process !== undefined) license.work_process = getUppercaseString(body.work_process);
  if (body.approved !== undefined) license.approved = parseBoolean(body.approved, false);
  if (body.faceless_type) license.faceless_type = normalizeFacelessType(body.faceless_type);

  if (body.fee !== undefined) license.fee = parseNumber(body.fee, 0);
  if (body.agent_fee !== undefined) license.agent_fee = parseNumber(body.agent_fee, 0);
  if (body.customer_payment !== undefined)
    license.customer_payment = parseNumber(body.customer_payment, 0);

  const folderName = sanitizeFolderName(license.lic_no);

  if (body.delete_documents) {
    let deleteIds: string[] = [];
    try {
      deleteIds =
        typeof body.delete_documents === 'string'
          ? JSON.parse(body.delete_documents)
          : body.delete_documents;
    } catch (e) {
      console.warn('Failed to parse delete_documents:', e);
    }

    if (Array.isArray(deleteIds) && deleteIds.length > 0) {
      for (const fileId of deleteIds) {
        try {
          await FileStorageService.deleteLicenseFile(fileId);
        } catch (err) {
          console.error('Failed to delete file:', fileId, err);
        }
      }
      license.documents = license.documents.filter(
        (doc) => !deleteIds.includes(doc.file_id)
      ) as any;
    }
  }

  if (files && files.documents && files.documents.length > 0) {
    const currentDocCount = license.documents.length;
    const maxNewDocs = 3 - currentDocCount;

    if (maxNewDocs > 0) {
      let docLabels: string[] = [];
      if (body.document_labels) {
        try {
          docLabels =
            typeof body.document_labels === 'string'
              ? JSON.parse(body.document_labels)
              : body.document_labels;
        } catch (e) {
          console.warn('Failed to parse document_labels:', e);
        }
      }

      const existingFileNames = license.documents.map((doc) => doc.file_name);

      const uploadedDocs = await Promise.all(
        files.documents.slice(0, maxNewDocs).map(async (file, index) => {
          const label = docLabels[index] || `Document ${currentDocCount + index + 1}`;
          const ext = file.originalname.split('.').pop()?.toLowerCase() || 'pdf';
          const fileName = generateFileName(label, ext, existingFileNames);
          existingFileNames.push(fileName);

          const result = await FileStorageService.uploadLicenseFile(
            file.buffer,
            fileName,
            file.mimetype,
            folderName
          );

          return {
            file_id: result.file_id,
            file_name: result.file_name,
            original_name: file.originalname,
            label: label.toUpperCase(),
            mime_type: file.mimetype,
            web_view_link: `/api/v1/licenses/files/${folderName}/${fileName}`,
            uploaded_at: new Date(),
          };
        })
      );

      license.documents = [...license.documents, ...uploadedDocs] as any;
    }
  }

  await license.save();

  await AuditService.log({
    user_id: req.user!.userId,
    action: 'update',
    resource_type: 'license',
    resource_id: license._id.toString(),
    details: { lic_no: license.lic_no },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: { license },
  });
});

/**
 * Delete license record
 * DELETE /api/v1/licenses/:id
 */
export const deleteLicense = asyncHandler(async (req: Request, res: Response) => {
  const license = await LicenseRecord.findById(req.params.id);

  if (!license) {
    throw new AppError('License record not found', 404);
  }

  for (const doc of license.documents) {
    try {
      await FileStorageService.deleteLicenseFile(doc.file_id);
    } catch (err) {
      console.error('Failed to delete file:', doc.file_id, err);
    }
  }

  await license.deleteOne();

  await AuditService.log({
    user_id: req.user!.userId,
    action: 'delete',
    resource_type: 'license',
    resource_id: license._id.toString(),
    details: { lic_no: license.lic_no },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'License record deleted successfully',
  });
});

/**
 * Get expiring licenses (default 90 days / 3 months)
 * GET /api/v1/licenses/expiring-soon
 */
export const getExpiringLicenses = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 90;
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const licenses = await LicenseRecord.find({
    expiry_date: { $gte: now, $lte: futureDate },
  })
    .populate('created_by', 'email full_name')
    .sort({ expiry_date: 1 })
    .limit(50);

  res.json({
    success: true,
    data: { licenses },
  });
});
