export interface ExportField {
  key: string;
  label: string;
  category: string;
}

export interface FieldCategory {
  key: string;
  label: string;
  fields: ExportField[];
}

export const EXPORT_FIELD_CATEGORIES: FieldCategory[] = [
  {
    key: 'policy',
    label: 'Policy Details',
    fields: [
      { key: 'serial_no', label: 'Serial Number', category: 'policy' },
      { key: 'policy_no', label: 'Policy Number', category: 'policy' },
      { key: 'issue_date', label: 'Issue Date', category: 'policy' },
      { key: 'ins_type', label: 'Insurance Type', category: 'policy' },
      { key: 'start_date', label: 'Start Date', category: 'policy' },
      { key: 'tenure', label: 'Tenure', category: 'policy' },
      { key: 'end_date', label: 'End Date', category: 'policy' },
      { key: 'ins_status', label: 'Insurance Status', category: 'policy' },
      { key: 'ins_co_id', label: 'Insurance Company', category: 'policy' },
      { key: 'insurance_dealer', label: 'Insurance Dealer', category: 'policy' },
      { key: 'saod_start_date', label: 'SAOD Start Date', category: 'policy' },
      { key: 'saod_end_date', label: 'SAOD End Date', category: 'policy' },
      { key: 'branch_id', label: 'Branch', category: 'policy' },
      { key: 'inspection', label: 'Inspection', category: 'policy' },
    ],
  },
  {
    key: 'customer',
    label: 'Customer Details',
    fields: [
      { key: 'customer', label: 'Customer Name', category: 'customer' },
      { key: 'adh_id', label: 'Aadhaar Number', category: 'customer' },
      { key: 'pan_no', label: 'PAN Number', category: 'customer' },
      { key: 'mobile_no', label: 'Mobile Number', category: 'customer' },
      { key: 'mobile_no_two', label: 'Mobile Number 2', category: 'customer' },
      { key: 'email', label: 'Email', category: 'customer' },
      { key: 'city_id', label: 'City', category: 'customer' },
      { key: 'address_1', label: 'Address', category: 'customer' },
      { key: 'exicutive_name', label: 'Executive Name', category: 'customer' },
      { key: 'nominee_name', label: 'Nominee Name', category: 'customer' },
      { key: 'nominee_dob', label: 'Nominee DOB', category: 'customer' },
      { key: 'nominee_relation', label: 'Nominee Relation', category: 'customer' },
    ],
  },
  {
    key: 'vehicle',
    label: 'Vehicle Details',
    fields: [
      { key: 'product', label: 'Product', category: 'vehicle' },
      { key: 'manufacturer', label: 'Manufacturer', category: 'vehicle' },
      { key: 'model_name', label: 'Model Name', category: 'vehicle' },
      { key: 'fuel_type', label: 'Fuel Type', category: 'vehicle' },
      { key: 'engine_no', label: 'Engine Number', category: 'vehicle' },
      { key: 'chassis_no', label: 'Chassis Number', category: 'vehicle' },
      { key: 'registration_number', label: 'Registration Number', category: 'vehicle' },
      { key: 'registration_date', label: 'Registration Date', category: 'vehicle' },
      { key: 'mfg_date', label: 'Manufacturing Date', category: 'vehicle' },
      { key: 'hypothecation', label: 'Hypothecation', category: 'vehicle' },
    ],
  },
  {
    key: 'premium',
    label: 'Premium Details',
    fields: [
      { key: 'sum_insured', label: 'Sum Insured', category: 'premium' },
      { key: 'cng_value', label: 'CNG Value', category: 'premium' },
      { key: 'od_premium', label: 'OD Premium', category: 'premium' },
      { key: 'net_premium', label: 'Net Premium', category: 'premium' },
      { key: 'total_premium_gst', label: 'Total Premium (with GST)', category: 'premium' },
      { key: 'ncb', label: 'NCB', category: 'premium' },
      { key: 'addon_coverage', label: 'Add-on Coverage', category: 'premium' },
      { key: 'agent_commission', label: 'Agent Commission', category: 'premium' },
      { key: 'extra_amount', label: 'Extra Amount', category: 'premium' },
      { key: 'profit', label: 'Profit', category: 'premium' },
      { key: 'other_remark', label: 'Other Remark', category: 'premium' },
    ],
  },
  {
    key: 'previous_policy',
    label: 'Previous Policy',
    fields: [
      { key: 'previous_policy_no', label: 'Previous Policy Number', category: 'previous_policy' },
      {
        key: 'previous_policy_company',
        label: 'Previous Policy Company',
        category: 'previous_policy',
      },
      {
        key: 'previous_policy_expiry_date',
        label: 'Previous Policy Expiry',
        category: 'previous_policy',
      },
      { key: 'previous_policy_ncb', label: 'Previous Policy NCB', category: 'previous_policy' },
      { key: 'previous_policy_claim', label: 'Previous Policy Claim', category: 'previous_policy' },
    ],
  },
  {
    key: 'payment',
    label: 'Payment Details',
    fields: [
      { key: 'premium_amount', label: 'Premium Amount', category: 'payment' },
      { key: 'customer_payment_type', label: 'Payment Type', category: 'payment' },
      { key: 'customer_payment_status', label: 'Payment Status', category: 'payment' },
      { key: 'voucher_no', label: 'Voucher Number', category: 'payment' },
    ],
  },
  {
    key: 'company_payment',
    label: 'Company Payment',
    fields: [
      { key: 'company_payment_mode', label: 'Company Payment Mode', category: 'company_payment' },
      { key: 'company_bank_name', label: 'Company Bank Name', category: 'company_payment' },
      { key: 'company_cheque_no', label: 'Cheque/UTR/Transaction No', category: 'company_payment' },
      { key: 'company_amount', label: 'Company Amount', category: 'company_payment' },
      { key: 'company_cheque_date', label: 'Cheque Date', category: 'company_payment' },
    ],
  },
  {
    key: 'system',
    label: 'System Info',
    fields: [
      { key: 'createdAt', label: 'Created At', category: 'system' },
      { key: 'updatedAt', label: 'Updated At', category: 'system' },
    ],
  },
];

// Default selected fields for "Export Selected" option
export const DEFAULT_SELECTED_FIELDS: string[] = [
  // Policy Details (excluding branch_id, inspection)
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
  // Customer Details (name, mobile, email, pan, aadhaar)
  'customer',
  'adh_id',
  'pan_no',
  'mobile_no',
  'email',
  // Vehicle Details (excluding registration_date, mfg_date, hypothecation)
  'product',
  'manufacturer',
  'model_name',
  'fuel_type',
  'engine_no',
  'chassis_no',
  'registration_number',
  // Premium Details (net, od, total, commission, ncb, extra_amount)
  'net_premium',
  'od_premium',
  'total_premium_gst',
  'agent_commission',
  'ncb',
  'extra_amount',
  // Payment Status
  'customer_payment_status',
];

// Get all field keys
export const ALL_EXPORT_FIELDS: string[] = EXPORT_FIELD_CATEGORIES.flatMap((category) =>
  category.fields.map((field) => field.key)
);
