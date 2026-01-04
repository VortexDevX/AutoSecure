// backend/src/controllers/exportController.ts
import { Request, Response } from 'express';
import { Policy } from '../models/Policy';
import { LicenseRecord } from '../models/LicenseRecord';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import ExcelJS from 'exceljs';

// All exportable fields
const ALL_EXPORT_FIELDS = [
  // Policy Details
  'serial_no',
  'policy_no',
  'issue_date',
  'ins_type',
  'start_date',
  'end_date',
  'ins_status',
  'ins_co_id',
  'insurance_dealer',
  'saod_start_date',
  'saod_end_date',
  'branch_id',
  'inspection',

  // Vehicle Details
  'product',
  'manufacturer',
  'model_name',
  'fuel_type',
  'engine_no',
  'chassis_no',
  'registration_number',
  'registration_date',
  'mfg_date',
  'hypothecation',

  // Customer Details
  'customer',
  'adh_id',
  'pan_no',
  'mobile_no',
  'mobile_no_two',
  'email',
  'city_id',
  'address_1',
  'exicutive_name',
  'nominee_name',
  'nominee_dob',
  'nominee_relation',

  // Premium Details
  'sum_insured',
  'cng_value',
  'od_premium',
  'net_premium',
  'total_premium_gst',
  'ncb',
  'addon_coverage',
  'agent_commission',
  'extra_amount',
  'profit',
  'other_remark',

  // Previous Policy
  'previous_policy_no',
  'previous_policy_company',
  'previous_policy_expiry_date',
  'previous_policy_ncb',
  'previous_policy_claim',

  // Payment Details
  'premium_amount',
  'customer_payment_type',
  'customer_payment_status',
  'voucher_no',

  // Company Payment
  'company_payment_mode',
  'company_bank_name',
  'company_cheque_no',
  'company_amount',
  'company_cheque_date',

  // System
  'createdAt',
  'updatedAt',
];

// Field labels for Excel headers
const FIELD_LABELS: Record<string, string> = {
  serial_no: 'Serial Number',
  policy_no: 'Policy Number',
  issue_date: 'Issue Date',
  ins_type: 'Insurance Type',
  start_date: 'Start Date',
  end_date: 'End Date',
  ins_status: 'Insurance Status',
  ins_co_id: 'Insurance Company',
  insurance_dealer: 'Insurance Dealer',
  saod_start_date: 'SAOD Start Date',
  saod_end_date: 'SAOD End Date',
  branch_id: 'Branch',
  inspection: 'Inspection',
  product: 'Product',
  manufacturer: 'Manufacturer',
  model_name: 'Model Name',
  fuel_type: 'Fuel Type',
  engine_no: 'Engine Number',
  chassis_no: 'Chassis Number',
  registration_number: 'Registration Number',
  registration_date: 'Registration Date',
  mfg_date: 'Manufacturing Date',
  hypothecation: 'Hypothecation',
  customer: 'Customer Name',
  adh_id: 'Aadhaar Number',
  pan_no: 'PAN Number',
  mobile_no: 'Mobile Number',
  mobile_no_two: 'Mobile Number 2',
  email: 'Email',
  city_id: 'City',
  address_1: 'Address',
  exicutive_name: 'Executive Name',
  nominee_name: 'Nominee Name',
  nominee_dob: 'Nominee DOB',
  nominee_relation: 'Nominee Relation',
  sum_insured: 'Sum Insured',
  cng_value: 'CNG Value',
  od_premium: 'OD Premium',
  net_premium: 'Net Premium',
  total_premium_gst: 'Total Premium (with GST)',
  ncb: 'NCB',
  addon_coverage: 'Add-on Coverage',
  agent_commission: 'Agent Commission',
  extra_amount: 'Extra Amount',
  profit: 'Profit',
  other_remark: 'Other Remark',
  previous_policy_no: 'Previous Policy Number',
  previous_policy_company: 'Previous Policy Company',
  previous_policy_expiry_date: 'Previous Policy Expiry',
  previous_policy_ncb: 'Previous Policy NCB',
  previous_policy_claim: 'Previous Policy Claim',
  premium_amount: 'Premium Amount',
  customer_payment_type: 'Payment Type',
  customer_payment_status: 'Payment Status',
  voucher_no: 'Voucher Number',
  company_payment_mode: 'Company Payment Mode',
  company_bank_name: 'Company Bank Name',
  company_cheque_no: 'Cheque/UTR/Transaction No',
  company_amount: 'Company Amount',
  company_cheque_date: 'Cheque Date',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
};

/**
 * POST /api/v1/exports/policies
 * Export policies to Excel
 */
export const exportPolicies = asyncHandler(async (req: Request, res: Response) => {
  const { fields, date_range, filters } = req.body;

  // Build query based on filters
  const query: Record<string, unknown> = {};

  // Date range filter
  if (date_range) {
    const { start, end } = date_range;
    if (start || end) {
      query.createdAt = {} as Record<string, Date>;
      if (start) (query.createdAt as Record<string, Date>).$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        (query.createdAt as Record<string, Date>).$lte = endDate;
      }
    }
  }

  // Additional filters
  if (filters) {
    if (filters.branch_id) query.branch_id = filters.branch_id;
    if (filters.ins_status) query.ins_status = filters.ins_status;
    if (filters.ins_co_id) query.ins_co_id = filters.ins_co_id;
    if (filters.ins_type) query.ins_type = filters.ins_type;
    if (filters.exicutive_name) query.exicutive_name = filters.exicutive_name;
    if (filters.customer_payment_status)
      query.customer_payment_status = filters.customer_payment_status;
  }

  // Fetch policies
  const policies = await Policy.find(query).populate('created_by', 'email full_name').lean();

  // Determine fields to export - use ALL fields if none specified
  const exportFields: string[] =
    fields && Array.isArray(fields) && fields.length > 0 ? fields : ALL_EXPORT_FIELDS;

  // Map data for Excel with proper labels
  const data = policies.map((policy: Record<string, unknown>) => {
    const row: Record<string, unknown> = {};
    exportFields.forEach((field) => {
      const label = FIELD_LABELS[field] || field;
      let value = policy[field];

      // Handle special fields
      if (field === 'addon_coverage' && Array.isArray(value)) {
        value = value.join(', ');
      } else if (field === 'createdAt' || field === 'updatedAt') {
        value = value ? new Date(value as string).toLocaleString('en-IN') : '';
      } else if (
        field === 'issue_date' ||
        field === 'start_date' ||
        field === 'end_date' ||
        field === 'saod_start_date' ||
        field === 'saod_end_date' ||
        field === 'registration_date' ||
        field === 'nominee_dob' ||
        field === 'previous_policy_expiry_date' ||
        field === 'company_cheque_date'
      ) {
        value = value ? new Date(value as string).toLocaleDateString('en-IN') : '';
      }

      // Convert coded string values like "two_wheeler" or "commercial-vehicle" into Title Case
      // but only for short, single-token codes (no spaces) to avoid touching addresses/emails.
      if (typeof value === 'string') {
        const codeLike = /^[a-z0-9_-]+$/;
        if (codeLike.test(value) && !value.includes(' ') && value.length <= 50) {
          value = value
            .replace(/[_-]+/g, ' ')
            .split(' ')
            .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join(' ');
        }
      }

      row[label] = value ?? '';
    });
    return row;
  });

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Policies');

  // Add header row with labels
  const headerRow = exportFields.map((field) => FIELD_LABELS[field] || field);
  worksheet.addRow(headerRow);

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };

  // Auto-size columns
  const colWidths = exportFields.map((field) => {
    const label = FIELD_LABELS[field] || field;
    return Math.max(label.length + 2, 15);
  });
  worksheet.columns = colWidths.map((width) => ({ width }));

  // Add data rows
  data.forEach((row) => {
    const rowValues = exportFields.map((field) => {
      const label = FIELD_LABELS[field] || field;
      return row[label] ?? '';
    });
    worksheet.addRow(rowValues);
  });

  // Generate buffer
  const excelBuffer = await workbook.xlsx.writeBuffer();

  // Audit log
  await AuditService.logExport(req.user!.userId, {
    type: 'policies',
    count: policies.length,
    fields: exportFields.length === ALL_EXPORT_FIELDS.length ? 'all' : exportFields,
    filters,
  });

  // Send file
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename=policies_export_${Date.now()}.xlsx`);

  res.send(excelBuffer);
});

/**
 * POST /api/v1/exports/policies/count
 * Get count of policies matching export criteria
 */
export const getExportCount = asyncHandler(async (req: Request, res: Response) => {
  const { date_range, filters } = req.body;

  // Build query based on filters
  const query: Record<string, unknown> = {};

  // Date range filter
  if (date_range) {
    const { start, end } = date_range;
    if (start || end) {
      query.createdAt = {} as Record<string, Date>;
      if (start) (query.createdAt as Record<string, Date>).$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        (query.createdAt as Record<string, Date>).$lte = endDate;
      }
    }
  }

  // Additional filters
  if (filters) {
    if (filters.branch_id) query.branch_id = filters.branch_id;
    if (filters.ins_status) query.ins_status = filters.ins_status;
    if (filters.ins_co_id) query.ins_co_id = filters.ins_co_id;
    if (filters.ins_type) query.ins_type = filters.ins_type;
    if (filters.exicutive_name) query.exicutive_name = filters.exicutive_name;
    if (filters.customer_payment_status)
      query.customer_payment_status = filters.customer_payment_status;
  }

  const count = await Policy.countDocuments(query);

  res.json({
    success: true,
    data: { count },
  });
});

/**
 * POST /api/v1/exports/licenses
 * Export licenses to Excel
 */
export const exportLicenses = asyncHandler(async (req: Request, res: Response) => {
  const { date_range, filters } = req.body;

  // Build query based on filters
  const query: Record<string, unknown> = {};

  // Date range filter (for expiry_date)
  if (date_range) {
    const { start, end } = date_range;
    if (start || end) {
      query.expiry_date = {} as Record<string, Date>;
      if (start) (query.expiry_date as Record<string, Date>).$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        (query.expiry_date as Record<string, Date>).$lte = endDate;
      }
    }
  }

  // Additional filters
  if (filters) {
    if (filters.customer_name)
      query.customer_name = { $regex: filters.customer_name, $options: 'i' };
    if (filters.lic_no) query.lic_no = { $regex: filters.lic_no, $options: 'i' };
    if (filters.license_type) query.license_type = filters.license_type;
    if (filters.approved !== undefined)
      query.approved = filters.approved === 'true' || filters.approved === true;
    if (filters.faceless_type) query.faceless_type = filters.faceless_type;
    if (filters.expiry_year) {
      // Filter by expiry year - licenses expiring in the selected year
      const year = parseInt(filters.expiry_year);
      if (!isNaN(year)) {
        const startOfYear = new Date(year, 0, 1); // January 1st of the year
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the year
        query.expiry_date = {
          $gte: startOfYear,
          $lte: endOfYear,
        };
      }
    }
  }

  // Expiring soon shortcut (next 90 days) - only apply when no explicit date_range provided
  if (filters && filters.expiring_soon && !date_range) {
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 90);
    query.expiry_date = {} as Record<string, Date>;
    (query.expiry_date as Record<string, Date>).$gte = now;
    (query.expiry_date as Record<string, Date>).$lte = end;
  }

  // Fetch licenses
  const licenses = await LicenseRecord.find(query)
    .populate('created_by', 'email full_name')
    .sort({ expiry_date: -1 })
    .lean();

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Licenses');

  // Define columns
  const columns = [
    { header: 'License Number', key: 'lic_no', width: 15 },
    { header: 'Application Number', key: 'application_no', width: 15 },
    { header: 'Customer Name', key: 'customer_name', width: 20 },
    { header: 'Customer Address', key: 'customer_address', width: 25 },
    { header: 'DOB', key: 'dob', width: 12 },
    { header: 'Mobile Number', key: 'mobile_no', width: 15 },
    { header: 'Aadhaar Number', key: 'aadhar_no', width: 15 },
    { header: 'Reference', key: 'reference', width: 15 },
    { header: 'Reference Mobile', key: 'reference_mobile_no', width: 15 },
    { header: 'Issue Date', key: 'issue_date', width: 12 },
    { header: 'Expiry Date', key: 'expiry_date', width: 12 },
    { header: 'Fee', key: 'fee', width: 10 },
    { header: 'Agent Fee', key: 'agent_fee', width: 10 },
    { header: 'Customer Payment', key: 'customer_payment', width: 12 },
    { header: 'Profit', key: 'profit', width: 10 },
    { header: 'Work Process', key: 'work_process', width: 12 },
    { header: 'Approved', key: 'approved', width: 10 },
    { header: 'Faceless Type', key: 'faceless_type', width: 12 },
    { header: 'Created At', key: 'createdAt', width: 15 },
  ];

  worksheet.columns = columns;

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };

  // Format dates and add data
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-IN');
    } catch {
      return '';
    }
  };

  licenses.forEach((license: Record<string, unknown>) => {
    worksheet.addRow({
      lic_no: license.lic_no || '',
      application_no: license.application_no || '',
      customer_name: license.customer_name || '',
      customer_address: license.customer_address || '',
      dob: formatDate(license.dob as string),
      mobile_no: license.mobile_no || '',
      aadhar_no: license.aadhar_no || '',
      reference: license.reference || '',
      reference_mobile_no: license.reference_mobile_no || '',
      issue_date: license.issue_date ? formatDate(license.issue_date as string) : '',
      expiry_date: formatDate(license.expiry_date as string),
      fee: license.fee || 0,
      agent_fee: license.agent_fee || 0,
      customer_payment: license.customer_payment || 0,
      profit: license.profit || 0,
      work_process: license.work_process || '',
      approved: license.approved ? 'Yes' : 'No',
      faceless_type: license.faceless_type || 'non-faceless',
      createdAt: formatDate(license.createdAt as string),
    });
  });

  // Generate buffer
  const excelBuffer = await workbook.xlsx.writeBuffer();

  // Audit log
  await AuditService.logExport(req.user!.userId, {
    type: 'licenses',
    count: licenses.length,
    fields: 'all',
    filters,
  });

  // Send file
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename=licenses_export_${Date.now()}.xlsx`);

  res.send(excelBuffer);
});

/**
 * POST /api/v1/exports/licenses/count
 * Get count of licenses matching export criteria
 */
export const getExportLicenseCount = asyncHandler(async (req: Request, res: Response) => {
  const { date_range, filters } = req.body;

  // Build query based on filters
  const query: Record<string, unknown> = {};

  // Date range filter
  if (date_range) {
    const { start, end } = date_range;
    if (start || end) {
      query.expiry_date = {} as Record<string, Date>;
      if (start) (query.expiry_date as Record<string, Date>).$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        (query.expiry_date as Record<string, Date>).$lte = endDate;
      }
    }
  }

  // Additional filters
  if (filters) {
    if (filters.customer_name)
      query.customer_name = { $regex: filters.customer_name, $options: 'i' };
    if (filters.lic_no) query.lic_no = { $regex: filters.lic_no, $options: 'i' };
    if (filters.license_type) query.license_type = filters.license_type;
    if (filters.approved !== undefined)
      query.approved = filters.approved === 'true' || filters.approved === true;
    if (filters.faceless_type) query.faceless_type = filters.faceless_type;
    if (filters.expiry_year) {
      // Filter by expiry year - licenses expiring in the selected year
      const year = parseInt(filters.expiry_year);
      if (!isNaN(year)) {
        const startOfYear = new Date(year, 0, 1); // January 1st of the year
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the year
        query.expiry_date = {
          $gte: startOfYear,
          $lte: endOfYear,
        };
      }
    }
  }

  const count = await LicenseRecord.countDocuments(query);

  res.json({
    success: true,
    data: { count },
  });
});
