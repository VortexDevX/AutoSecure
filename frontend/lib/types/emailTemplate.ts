export interface EmailTemplate {
  _id: string;
  template_id: string;
  name: string;
  subject: string;
  body_html: string;
  active: boolean;
  created_by:
    | {
        _id: string;
        email: string;
      }
    | string;
  updated_by:
    | {
        _id: string;
        email: string;
      }
    | string;
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
  message?: string;
}

export interface EmailTemplateUpdatePayload {
  name?: string;
  subject?: string;
  body_html?: string;
  active?: boolean;
}

// Available variables for template substitution
export interface TemplateVariable {
  key: string;
  label: string;
  section: 'policy' | 'customer' | 'vehicle' | 'company';
  example: string;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Policy Details
  { key: '{{policy_no}}', label: 'Policy Number', section: 'policy', example: 'POL-2025-001' },
  { key: '{{serial_no}}', label: 'Serial Number', section: 'policy', example: 'SN-001' },
  { key: '{{issue_date}}', label: 'Issue Date', section: 'policy', example: '15 Jan 2025' },
  { key: '{{ins_type}}', label: 'Insurance Type', section: 'policy', example: 'Comprehensive' },
  { key: '{{ins_co_id}}', label: 'Insurance Company', section: 'policy', example: 'ICICI Lombard' },
  { key: '{{start_date}}', label: 'Start Date', section: 'policy', example: '15 Jan 2025' },
  { key: '{{end_date}}', label: 'End Date', section: 'policy', example: '14 Jan 2026' },
  { key: '{{ins_status}}', label: 'Policy Status', section: 'policy', example: 'Active' },
  { key: '{{inspection}}', label: 'Inspection Required', section: 'policy', example: 'Yes' },

  // Customer Details
  { key: '{{customer}}', label: 'Customer Name', section: 'customer', example: 'John Doe' },
  { key: '{{mobile_no}}', label: 'Mobile Number', section: 'customer', example: '9876543210' },
  { key: '{{email}}', label: 'Email Address', section: 'customer', example: 'john@example.com' },
  {
    key: '{{address_1}}',
    label: 'Address',
    section: 'customer',
    example: '123 Main Street, Mumbai',
  },
  { key: '{{city_id}}', label: 'City', section: 'customer', example: 'Mumbai' },
  { key: '{{branch_id}}', label: 'Branch', section: 'customer', example: 'Mumbai Central' },
  {
    key: '{{exicutive_name}}',
    label: 'Executive Name',
    section: 'customer',
    example: 'Rahul Sharma',
  },
  { key: '{{nominee_name}}', label: 'Nominee Name', section: 'customer', example: 'Jane Doe' },
  {
    key: '{{nominee_relation}}',
    label: 'Nominee Relation',
    section: 'customer',
    example: 'Spouse',
  },

  // Vehicle Details
  { key: '{{product}}', label: 'Product Type', section: 'vehicle', example: 'Private Car' },
  { key: '{{manufacturer}}', label: 'Manufacturer', section: 'vehicle', example: 'Maruti Suzuki' },
  { key: '{{model_name}}', label: 'Model Name', section: 'vehicle', example: 'Swift VXI' },
  { key: '{{fuel_type}}', label: 'Fuel Type', section: 'vehicle', example: 'Petrol' },
  {
    key: '{{registration_number}}',
    label: 'Registration Number',
    section: 'vehicle',
    example: 'MH01AB1234',
  },
  {
    key: '{{registration_date}}',
    label: 'Registration Date',
    section: 'vehicle',
    example: '10 Mar 2020',
  },
  { key: '{{engine_no}}', label: 'Engine Number', section: 'vehicle', example: 'K12MN1234567' },
  {
    key: '{{chassis_no}}',
    label: 'Chassis Number',
    section: 'vehicle',
    example: 'MA3FJEB1S00123456',
  },
  { key: '{{mfg_date}}', label: 'Manufacturing Date', section: 'vehicle', example: 'Feb 2020' },
  { key: '{{hypothecation}}', label: 'Hypothecation', section: 'vehicle', example: 'HDFC Bank' },

  // Company Info (editable in template)
  {
    key: '{{company_name}}',
    label: 'Company Name',
    section: 'company',
    example: 'AutoSecure Insurance',
  },
  {
    key: '{{company_email}}',
    label: 'Company Email',
    section: 'company',
    example: 'hareshpatel13790@gmail.com',
  },
  {
    key: '{{company_phone}}',
    label: 'Company Phone',
    section: 'company',
    example: '+91 99240 74840',
  },
  {
    key: '{{company_address}}',
    label: 'Company Address',
    section: 'company',
    example: 'Ahmedabad',
  },
  {
    key: '{{company_tagline}}',
    label: 'Company Tagline',
    section: 'company',
    example: 'Your Trusted Insurance Partner',
  },

  // System
  { key: '{{current_date}}', label: 'Current Date', section: 'policy', example: '15 Jan 2025' },
  { key: '{{current_year}}', label: 'Current Year', section: 'policy', example: '2025' },
];
