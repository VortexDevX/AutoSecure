export interface EmailTemplate {
  _id: string;
  template_id: string;
  name: string;
  subject: string;
  body_html: string;
  active: boolean;
  created_by: { email: string } | string;
  updated_by: { email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateListResponse {
  success: boolean;
  count: number;
  data: EmailTemplate[];
}

export interface EmailTemplateResponse {
  success: boolean;
  data: EmailTemplate;
}

export interface EmailTemplateUpdatePayload {
  name?: string;
  subject?: string;
  body_html?: string;
  active?: boolean;
}

export interface TemplateVariable {
  key: string;
  label: string;
  example: string;
  section: string;
}

// Policy Template Variables
export const POLICY_TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Policy Details
  { key: '{{policy_no}}', label: 'Policy Number', example: 'POL-2024-001234', section: 'policy' },
  { key: '{{serial_no}}', label: 'Serial Number', example: 'SN-001', section: 'policy' },
  { key: '{{issue_date}}', label: 'Issue Date', example: '15 Jan 2024', section: 'policy' },
  { key: '{{ins_type}}', label: 'Insurance Type', example: 'Comprehensive', section: 'policy' },
  { key: '{{ins_co_id}}', label: 'Insurance Company', example: 'HDFC ERGO', section: 'policy' },
  { key: '{{start_date}}', label: 'Start Date', example: '15 Jan 2024', section: 'policy' },
  { key: '{{end_date}}', label: 'End Date', example: '14 Jan 2025', section: 'policy' },
  { key: '{{ins_status}}', label: 'Insurance Status', example: 'Active', section: 'policy' },
  { key: '{{inspection}}', label: 'Inspection Required', example: 'No', section: 'policy' },

  // Customer Details
  { key: '{{customer}}', label: 'Customer Name', example: 'John Doe', section: 'customer' },
  { key: '{{mobile_no}}', label: 'Mobile Number', example: '9876543210', section: 'customer' },
  { key: '{{email}}', label: 'Email Address', example: 'john@example.com', section: 'customer' },
  { key: '{{address_1}}', label: 'Address', example: '123 Main Street', section: 'customer' },
  { key: '{{city_id}}', label: 'City', example: 'Mumbai', section: 'customer' },
  { key: '{{branch_id}}', label: 'Branch', example: 'Mumbai Central', section: 'customer' },
  {
    key: '{{exicutive_name}}',
    label: 'Executive Name',
    example: 'Jane Smith',
    section: 'customer',
  },
  { key: '{{nominee_name}}', label: 'Nominee Name', example: 'Mary Doe', section: 'customer' },
  {
    key: '{{nominee_relation}}',
    label: 'Nominee Relation',
    example: 'Spouse',
    section: 'customer',
  },

  // Vehicle Details
  { key: '{{product}}', label: 'Product Type', example: 'Private Car', section: 'vehicle' },
  { key: '{{manufacturer}}', label: 'Manufacturer', example: 'Maruti Suzuki', section: 'vehicle' },
  { key: '{{model_name}}', label: 'Model Name', example: 'Swift VXI', section: 'vehicle' },
  { key: '{{fuel_type}}', label: 'Fuel Type', example: 'Petrol', section: 'vehicle' },
  {
    key: '{{registration_number}}',
    label: 'Registration Number',
    example: 'MH01AB1234',
    section: 'vehicle',
  },
  {
    key: '{{registration_date}}',
    label: 'Registration Date',
    example: '10 Mar 2020',
    section: 'vehicle',
  },
  { key: '{{engine_no}}', label: 'Engine Number', example: 'K12M1234567', section: 'vehicle' },
  {
    key: '{{chassis_no}}',
    label: 'Chassis Number',
    example: 'MA3FJEB1S00123456',
    section: 'vehicle',
  },
  { key: '{{mfg_date}}', label: 'Manufacturing Date', example: 'Feb 2020', section: 'vehicle' },
  { key: '{{hypothecation}}', label: 'Hypothecation', example: 'HDFC Bank', section: 'vehicle' },

  // Company Details
  {
    key: '{{company_name}}',
    label: 'Company Name',
    example: 'AutoSecure Insurance',
    section: 'company',
  },
  {
    key: '{{company_email}}',
    label: 'Company Email',
    example: 'support@autosecure.com',
    section: 'company',
  },
  {
    key: '{{company_phone}}',
    label: 'Company Phone',
    example: '+91 98765 43210',
    section: 'company',
  },
  {
    key: '{{company_address}}',
    label: 'Company Address',
    example: 'Mumbai, Maharashtra',
    section: 'company',
  },
  {
    key: '{{current_date}}',
    label: 'Current Date',
    example: '15 Jan 2024, 10:30 AM',
    section: 'company',
  },
  { key: '{{current_year}}', label: 'Current Year', example: '2024', section: 'company' },
];

// License Template Variables
export const LICENSE_TEMPLATE_VARIABLES: TemplateVariable[] = [
  // License Details
  { key: '{{lic_no}}', label: 'License Number', example: 'DL-2024-001234', section: 'license' },
  {
    key: '{{application_no}}',
    label: 'Application Number',
    example: 'APP-2024-5678',
    section: 'license',
  },
  { key: '{{expiry_date}}', label: 'Expiry Date', example: '15 Jan 2025', section: 'license' },
  { key: '{{work_process}}', label: 'Work Process', example: 'RENEWAL', section: 'license' },
  { key: '{{faceless_type}}', label: 'Type', example: 'Faceless', section: 'license' },
  { key: '{{approved}}', label: 'Approval Status', example: 'Yes', section: 'license' },

  // Customer Details
  {
    key: '{{customer_name}}',
    label: 'Customer Name',
    example: 'John Doe',
    section: 'license_customer',
  },
  { key: '{{dob}}', label: 'Date of Birth', example: '15 Aug 1990', section: 'license_customer' },
  {
    key: '{{mobile_no}}',
    label: 'Mobile Number',
    example: '9876543210',
    section: 'license_customer',
  },
  {
    key: '{{aadhar_no}}',
    label: 'Aadhar Number',
    example: '1234 5678 9012',
    section: 'license_customer',
  },
  {
    key: '{{customer_address}}',
    label: 'Customer Address',
    example: '123 Main Street, Mumbai',
    section: 'license_customer',
  },

  // Reference Details
  {
    key: '{{reference}}',
    label: 'Reference Name',
    example: 'Jane Smith',
    section: 'license_reference',
  },
  {
    key: '{{reference_mobile_no}}',
    label: 'Reference Mobile',
    example: '9876543211',
    section: 'license_reference',
  },

  // Financial Details
  { key: '{{fee}}', label: 'Fee', example: '500', section: 'license_financial' },
  { key: '{{agent_fee}}', label: 'Agent Fee', example: '100', section: 'license_financial' },
  {
    key: '{{customer_payment}}',
    label: 'Customer Payment',
    example: '500',
    section: 'license_financial',
  },
  { key: '{{profit}}', label: 'Profit', example: '400', section: 'license_financial' },

  // Company Details
  {
    key: '{{company_name}}',
    label: 'Company Name',
    example: 'AutoSecure Insurance',
    section: 'company',
  },
  {
    key: '{{company_email}}',
    label: 'Company Email',
    example: 'support@autosecure.com',
    section: 'company',
  },
  {
    key: '{{company_phone}}',
    label: 'Company Phone',
    example: '+91 98765 43210',
    section: 'company',
  },
  {
    key: '{{company_address}}',
    label: 'Company Address',
    example: 'Mumbai, Maharashtra',
    section: 'company',
  },
  {
    key: '{{current_date}}',
    label: 'Current Date',
    example: '15 Jan 2024, 10:30 AM',
    section: 'company',
  },
  { key: '{{current_year}}', label: 'Current Year', example: '2024', section: 'company' },
];

// Combined for backward compatibility - used to determine which variables to show based on template_id
export const TEMPLATE_VARIABLES = POLICY_TEMPLATE_VARIABLES;

// Helper to get variables for a specific template
export const getVariablesForTemplate = (templateId: string): TemplateVariable[] => {
  if (templateId === 'license_details') {
    return LICENSE_TEMPLATE_VARIABLES;
  }
  return POLICY_TEMPLATE_VARIABLES;
};

// Section labels for Policy templates
export const POLICY_SECTION_LABELS: Record<string, { label: string; icon: string }> = {
  policy: { label: 'Policy Details', icon: '📋' },
  customer: { label: 'Customer Details', icon: '👤' },
  vehicle: { label: 'Vehicle Details', icon: '🚗' },
  company: { label: 'Company Info', icon: '🏢' },
};

// Section labels for License templates
export const LICENSE_SECTION_LABELS: Record<string, { label: string; icon: string }> = {
  license: { label: 'License Details', icon: '📋' },
  license_customer: { label: 'Customer Details', icon: '👤' },
  license_reference: { label: 'Reference Details', icon: '📞' },
  license_financial: { label: 'Financial Details', icon: '💰' },
  company: { label: 'Company Info', icon: '🏢' },
};

// Helper to get section labels for a specific template
export const getSectionLabelsForTemplate = (
  templateId: string
): Record<string, { label: string; icon: string }> => {
  if (templateId === 'license_details') {
    return LICENSE_SECTION_LABELS;
  }
  return POLICY_SECTION_LABELS;
};
