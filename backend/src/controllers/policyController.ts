import { Request, Response } from 'express';
import { Policy, IPolicy } from '../models/Policy';
import { FileStorageService } from '../services/fileStorageService';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * Generate next serial number (AS20250001 format)
 */
async function generateSerialNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `AS${currentYear}`;

  const lastPolicy = await Policy.findOne({
    serial_no: { $regex: `^${prefix}` },
  })
    .sort({ serial_no: -1 })
    .limit(1);

  let nextNumber = 1;

  if (lastPolicy && lastPolicy.serial_no) {
    const lastNumber = parseInt(lastPolicy.serial_no.replace(prefix, ''), 10);
    nextNumber = lastNumber + 1;
  }

  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}

/**
 * GET /api/v1/policies
 * List all policies with filtering, pagination, search
 */
export const listPolicies = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    search = '',
    branch_id,
    ins_status,
    customer_payment_status,
    sort_by = 'createdAt',
    sort_order = 'desc',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  if (pageNum < 1) {
    throw new ValidationError('Page must be >= 1');
  }
  if (limitNum < 1 || limitNum > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }

  const query: any = {};

  if (search) {
    query.$or = [
      { policy_no: { $regex: search, $options: 'i' } },
      { customer: { $regex: search, $options: 'i' } },
      { registration_number: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (branch_id) query.branch_id = branch_id;
  if (ins_status) query.ins_status = ins_status;
  if (customer_payment_status) query.customer_payment_status = customer_payment_status;

  const [policies, total] = await Promise.all([
    Policy.find(query)
      .populate('created_by', 'email full_name')
      .sort({ [sort_by as string]: sort_order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Policy.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  res.json({
    status: 'success',
    data: {
      policies: policies.map((policy: any) => ({
        id: policy._id.toString(),
        serial_no: policy.serial_no,
        policy_no: policy.policy_no,
        customer: policy.customer,
        email: policy.email,
        mobile_no: policy.mobile_no,
        registration_number: policy.registration_number,
        ins_status: policy.ins_status,
        customer_payment_status: policy.customer_payment_status,
        premium_amount: policy.premium_amount,
        start_date: policy.start_date,
        end_date: policy.end_date,
        saod_end_date: policy.saod_end_date,
        created_by: policy.created_by,
        created_at: policy.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage,
        next_page: hasNextPage ? pageNum + 1 : null,
        previous_page: hasPreviousPage ? pageNum - 1 : null,
      },
    },
  });
});

/**
 * GET /api/v1/policies/:id
 * Get single policy details
 */
export const getPolicy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const policy = (await Policy.findById(id).populate(
    'created_by',
    'email full_name'
  )) as IPolicy | null;

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  res.json({
    status: 'success',
    data: {
      policy: {
        id: policy._id.toString(),
        ...policy.toJSON(),
      },
    },
  });
});

/**
 * ✅ Helper: Process other documents from uploaded files
 */
async function processOtherDocuments(
  files: { [fieldname: string]: Express.Multer.File[] } | undefined,
  otherDocLabels: string[],
  folderId: string
): Promise<
  Array<{
    file_id: string;
    file_name: string;
    label: string;
    mime_type: string;
    web_view_link: string;
    uploaded_at: Date;
  }>
> {
  const otherDocs: Array<{
    file_id: string;
    file_name: string;
    label: string;
    mime_type: string;
    web_view_link: string;
    uploaded_at: Date;
  }> = [];

  if (!files) return otherDocs;

  for (let i = 0; i < 5; i++) {
    const fieldName = `other_doc_${i}`;
    const fileArray = files[fieldName];

    if (fileArray && fileArray[0] && otherDocLabels[i]) {
      const file = fileArray[0];
      const label = otherDocLabels[i];
      const ext = file.mimetype.split('/')[1] || 'pdf';
      const fileName = `${label.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${ext}`;

      const uploadedFile = await FileStorageService.uploadFile(
        file.buffer,
        fileName,
        file.mimetype,
        folderId
      );

      otherDocs.push({
        file_id: uploadedFile.file_id,
        file_name: uploadedFile.file_name,
        label: label,
        mime_type: file.mimetype,
        web_view_link: uploadedFile.web_view_link,
        uploaded_at: new Date(),
      });
    }
  }

  return otherDocs;
}

/**
 * Get all policies (with pagination, search, filters)
 * GET /api/v1/policies
 */
export const getPolicies = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const search = req.query.search as string;
  const ins_status = req.query.ins_status as string;
  const branch_id = req.query.branch_id as string;
  const customer_payment_status = req.query.customer_payment_status as string;
  const expiringSoon = req.query.expiring_soon as string;

  // Build query
  const query: any = {};

  if (search) {
    query.$or = [
      { policy_no: { $regex: search, $options: 'i' } },
      { customer: { $regex: search, $options: 'i' } },
      { registration_number: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { serial_no: { $regex: search, $options: 'i' } },
    ];
  }

  if (ins_status) query.ins_status = ins_status;
  if (branch_id) query.branch_id = branch_id;
  if (customer_payment_status) query.customer_payment_status = customer_payment_status;

  // Expiring soon filter (next 30 days)
  if (expiringSoon === 'true') {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Use $and to combine with existing query conditions
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { saod_end_date: { $gte: now, $lte: thirtyDaysFromNow } },
        {
          end_date: { $gte: now, $lte: thirtyDaysFromNow },
          saod_end_date: { $exists: false },
        },
        {
          end_date: { $gte: now, $lte: thirtyDaysFromNow },
          saod_end_date: null,
        },
      ],
    });
  }

  const [policies, total] = await Promise.all([
    Policy.find(query)
      .populate('created_by', 'email full_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        'serial_no policy_no customer email mobile_no registration_number ins_status customer_payment_status premium_amount net_premium start_date end_date saod_end_date created_by createdAt'
      ),
    Policy.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      policies: policies.map((policy: any) => ({
        id: policy._id.toString(),
        serial_no: policy.serial_no || '',
        policy_no: policy.policy_no,
        customer: policy.customer,
        email: policy.email,
        mobile_no: policy.mobile_no,
        registration_number: policy.registration_number,
        ins_status: policy.ins_status,
        customer_payment_status: policy.customer_payment_status,
        premium_amount: policy.premium_amount,
        net_premium: policy.net_premium,
        start_date: policy.start_date,
        end_date: policy.end_date,
        saod_end_date: policy.saod_end_date,
        created_by: policy.created_by,
        created_at: policy.createdAt,
      })),
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
 * POST /api/v1/policies
 * Create new policy with file uploads
 */
export const createPolicy = asyncHandler(async (req: Request, res: Response) => {
  const policyData = { ...req.body };
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  // ✅ Remove other_documents from policyData (we'll process it separately)
  delete policyData.other_documents;

  const serialNumber = await generateSerialNumber();

  const requiredFields = [
    'policy_no',
    'customer',
    'registration_number',
    'premium_amount',
    'customer_payment_status',
    'ins_type',
    'start_date',
    'end_date',
    'ins_status',
    'ins_co_id',
    'inspection',
    'branch_id',
    'exicutive_name',
    'product',
  ];

  const missingFields = requiredFields.filter((field) => !policyData[field]);
  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }

  const folderId = await FileStorageService.createPolicyFolder(policyData.policy_no);

  // Upload Aadhaar file if provided
  let adhFile;
  if (files && files.adh_file && files.adh_file[0]) {
    const file = files.adh_file[0];

    adhFile = await FileStorageService.uploadFile(
      file.buffer,
      `aadhaar_${policyData.adh_id || 'doc'}.${file.mimetype.split('/')[1]}`,
      file.mimetype,
      folderId
    );
  }

  // Upload PAN file if provided
  let panFile;
  if (files && files.pan_file && files.pan_file[0]) {
    const file = files.pan_file[0];

    panFile = await FileStorageService.uploadFile(
      file.buffer,
      `pan_${policyData.pan_no || 'doc'}.${file.mimetype.split('/')[1]}`,
      file.mimetype,
      folderId
    );
  }

  // ✅ Process other documents
  let otherDocLabels: string[] = [];
  if (policyData.other_doc_labels) {
    try {
      otherDocLabels =
        typeof policyData.other_doc_labels === 'string'
          ? JSON.parse(policyData.other_doc_labels)
          : policyData.other_doc_labels;
    } catch (e) {
      console.warn('Failed to parse other_doc_labels:', e);
    }
  }
  delete policyData.other_doc_labels;

  const otherDocs = await processOtherDocuments(files, otherDocLabels, folderId);

  // Parse JSON fields
  if (typeof policyData.payment_details === 'string') {
    try {
      policyData.payment_details = JSON.parse(policyData.payment_details);
    } catch (e) {
      policyData.payment_details = [];
    }
  }
  if (typeof policyData.addon_coverage === 'string') {
    try {
      policyData.addon_coverage = JSON.parse(policyData.addon_coverage);
    } catch (e) {
      policyData.addon_coverage = [];
    }
  }

  const policy = (await Policy.create({
    ...policyData,
    serial_no: serialNumber,
    created_by: req.user!.userId,
    drive_folder_id: folderId,
    adh_file: adhFile
      ? {
          file_id: adhFile.file_id,
          file_name: adhFile.file_name,
          mime_type: adhFile.mime_type,
          web_view_link: adhFile.web_view_link,
          uploaded_at: new Date(),
        }
      : undefined,
    pan_file: panFile
      ? {
          file_id: panFile.file_id,
          file_name: panFile.file_name,
          mime_type: panFile.mime_type,
          web_view_link: panFile.web_view_link,
          uploaded_at: new Date(),
        }
      : undefined,
    other_documents: otherDocs.length > 0 ? otherDocs : undefined,
  })) as IPolicy;

  await AuditService.logCreate(req.user!.userId, 'policy', policy._id.toString(), {
    policy_no: policy.policy_no,
    serial_no: serialNumber,
    customer: policy.customer,
    folder_id: folderId,
  });

  res.status(201).json({
    status: 'success',
    message: 'Policy created successfully',
    data: {
      policy: {
        id: policy._id.toString(),
        serial_no: serialNumber,
        policy_no: policy.policy_no,
        customer: policy.customer,
        drive_folder_id: folderId,
        adh_file: policy.adh_file,
        pan_file: policy.pan_file,
        other_documents: policy.other_documents,
      },
    },
  });
});

/**
 * PATCH /api/v1/policies/:id
 * Update policy (with optional file updates)
 */
export const updatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  const policy = (await Policy.findById(id)) as IPolicy | null;

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  // ✅ Remove other_documents from updateData (we'll process it separately)
  delete updateData.other_documents;

  // Update Aadhaar file if new one provided
  if (files && files.adh_file && files.adh_file[0]) {
    const file = files.adh_file[0];

    if (policy.adh_file?.file_id) {
      try {
        await FileStorageService.deleteFile(policy.adh_file.file_id);
      } catch (error) {
        console.warn('⚠️ Failed to delete old Aadhaar file');
      }
    }

    const adhFile = await FileStorageService.uploadFile(
      file.buffer,
      `aadhaar_${updateData.adh_id || policy.adh_id || 'doc'}.${file.mimetype.split('/')[1]}`,
      file.mimetype,
      policy.drive_folder_id
    );

    policy.adh_file = {
      file_id: adhFile.file_id,
      file_name: adhFile.file_name,
      mime_type: adhFile.mime_type,
      web_view_link: adhFile.web_view_link,
      uploaded_at: new Date(),
    };
  }

  // Update PAN file if new one provided
  if (files && files.pan_file && files.pan_file[0]) {
    const file = files.pan_file[0];

    if (policy.pan_file?.file_id) {
      try {
        await FileStorageService.deleteFile(policy.pan_file.file_id);
      } catch (error) {
        console.warn('⚠️ Failed to delete old PAN file');
      }
    }

    const panFile = await FileStorageService.uploadFile(
      file.buffer,
      `pan_${updateData.pan_no || policy.pan_no || 'doc'}.${file.mimetype.split('/')[1]}`,
      file.mimetype,
      policy.drive_folder_id
    );

    policy.pan_file = {
      file_id: panFile.file_id,
      file_name: panFile.file_name,
      mime_type: panFile.mime_type,
      web_view_link: panFile.web_view_link,
      uploaded_at: new Date(),
    };
  }

  // ✅ Process new other documents (if any)
  let otherDocLabels: string[] = [];
  if (updateData.other_doc_labels) {
    try {
      otherDocLabels =
        typeof updateData.other_doc_labels === 'string'
          ? JSON.parse(updateData.other_doc_labels)
          : updateData.other_doc_labels;
    } catch (e) {
      console.warn('Failed to parse other_doc_labels:', e);
    }
  }
  delete updateData.other_doc_labels;

  // Check if there are new other docs to upload
  const hasNewOtherDocs =
    otherDocLabels.length > 0 &&
    files &&
    (files.other_doc_0 ||
      files.other_doc_1 ||
      files.other_doc_2 ||
      files.other_doc_3 ||
      files.other_doc_4);

  if (hasNewOtherDocs) {
    const newOtherDocs = await processOtherDocuments(files, otherDocLabels, policy.drive_folder_id);

    // Append new docs to existing ones (or replace if you prefer)
    const existingDocs = policy.other_documents || [];
    policy.other_documents = [...existingDocs, ...newOtherDocs] as any;
  }

  // Parse JSON fields if needed
  if (typeof updateData.payment_details === 'string') {
    try {
      updateData.payment_details = JSON.parse(updateData.payment_details);
    } catch (e) {
      delete updateData.payment_details;
    }
  }
  if (typeof updateData.addon_coverage === 'string') {
    try {
      updateData.addon_coverage = JSON.parse(updateData.addon_coverage);
    } catch (e) {
      delete updateData.addon_coverage;
    }
  }

  // Update other fields (excluding files which we handled above)
  const fieldsToUpdate = { ...updateData };
  delete fieldsToUpdate.adh_file;
  delete fieldsToUpdate.pan_file;

  Object.assign(policy, fieldsToUpdate);
  await policy.save();

  await AuditService.logUpdate(req.user!.userId, 'policy', policy._id.toString(), {
    policy_no: policy.policy_no,
  });

  res.json({
    status: 'success',
    message: 'Policy updated successfully',
    data: {
      policy: {
        id: policy._id.toString(),
        policy_no: policy.policy_no,
      },
    },
  });
});

/**
 * DELETE /api/v1/policies/:id
 * Hard delete with local backup
 */
export const deletePolicy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const policy = (await Policy.findById(id)) as IPolicy | null;

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  try {
    const backupPath = await FileStorageService.backupPolicyFolder(
      policy.policy_no,
      policy.drive_folder_id
    );
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw new ValidationError(
      'Failed to backup policy before deletion. Deletion aborted for safety.'
    );
  }

  await AuditService.logDelete(req.user!.userId, 'policy', policy._id.toString(), {
    policy_no: policy.policy_no,
    customer: policy.customer,
    backup_completed: true,
  });

  await policy.deleteOne();

  await FileStorageService.deletePolicyFolder(policy.drive_folder_id);

  res.json({
    status: 'success',
    message: 'Policy deleted successfully (backed up locally)',
  });
});
