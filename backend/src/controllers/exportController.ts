// backend/src/controllers/exportController.ts
import { Request, Response } from 'express';
import { Policy } from '../models/Policy';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import * as XLSX from 'xlsx';

// All exportable fields
const ALL_EXPORT_FIELDS = [
  // Policy Details
  'serial_no',
  'policy_no',
  'issue_date',
  'ins_type',
  'start_date',
  'tenure',
  'end_date',
  'ins_status',
  'ins_co_id',
  'insurance_dealer',
  'saod_start_date',
  'saod_end_date',
  'branch_id',
  'inspection',

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
  tenure: 'Tenure',
  end_date: 'End Date',
  ins_status: 'Insurance Status',
  ins_co_id: 'Insurance Company',
  insurance_dealer: 'Insurance Dealer',
  saod_start_date: 'SAOD Start Date',
  saod_end_date: 'SAOD End Date',
  branch_id: 'Branch',
  inspection: 'Inspection',
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
        field === 'mfg_date' ||
        field === 'nominee_dob' ||
        field === 'previous_policy_expiry_date' ||
        field === 'company_cheque_date'
      ) {
        value = value ? new Date(value as string).toLocaleDateString('en-IN') : '';
      }

      row[label] = value ?? '';
    });
    return row;
  });

  // Create workbook
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = exportFields.map((field) => {
    const label = FIELD_LABELS[field] || field;
    return { wch: Math.max(label.length + 2, 15) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Policies');

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

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
