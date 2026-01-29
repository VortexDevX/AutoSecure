export interface DriveFile {
  file_id: string;
  file_name: string;
  mime_type: string;
  web_view_link: string;
  uploaded_at: string;
}

export interface PaymentDetail {
  payment_mode: string;
  collect_amount: number;
  collect_remark?: string;
}

export interface OtherDocument {
  file_id?: string;
  file_name: string;
  label: string;
  mime_type?: string;
  web_view_link?: string;
  uploaded_at?: string;
}

export interface Policy {
  _id: string;

  // Policy Details
  serial_no: string;
  policy_no: string;
  issue_date: string;
  ins_type: string;
  start_date: string;
  end_date: string;
  ins_status: string;
  ins_co_id: string;
  insurance_dealer?: string;
  saod_start_date?: string;
  saod_end_date?: string;
  inspection: 'yes' | 'no';

  // Customer Details
  branch_id: string;
  created_by: string | { _id: string; email: string; full_name?: string };
  exicutive_name: string;
  customer: string;
  adh_id?: string;
  adh_file?: DriveFile;
  pan_no?: string;
  pan_file?: DriveFile;
  mobile_no?: string;
  mobile_no_two?: string;
  email?: string;
  city_id?: string;
  address_1?: string;

  // Nominee Details
  nominee_name?: string;
  nominee_dob?: string;
  nominee_relation?: string;

  // Vehicle Details
  product: string;
  manufacturer?: string;
  fuel_type?: string;
  hypothecation?: string;
  model_name?: string;
  mfg_date?: string;
  engine_no?: string;
  chassis_no?: string;
  registration_number: string;
  registration_date?: string;

  // Premium Details
  sum_insured?: number;
  cng_value?: number;
  od_premium?: number;
  ncb?: string;
  net_premium?: number;
  total_premium_gst?: number;
  addon_coverage?: string[];
  agent_commission?: number;
  date?: string;
  other_remark?: string;

  // Previous Policy Details
  previous_policy_no?: string;
  previous_policy_company?: string;
  previous_policy_expiry_date?: string;
  previous_policy_ncb?: string;
  previous_policy_claim?: 'yes' | 'no';

  // Other Documents
  other_documents?: OtherDocument[];

  // Customer Payment
  premium_amount: number;
  customer_payment_type?: string;
  customer_payment_status: 'pending' | 'done';
  voucher_no?: number;
  payment_details: PaymentDetail[];
  extra_amount?: number;
  profit?: number;

  // Company Payment (formerly Krunal)
  company_payment_mode?: string;
  company_bank_name?: string;
  company_cheque_no?: string;
  company_amount?: number;
  company_cheque_date?: string;

  // System
  drive_folder_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyFormData {
  // Policy Details (serial_no is auto-generated, not in form)
  policy_no: string;
  issue_date: string;
  ins_type: string;
  start_date: string;
  end_date: string;
  ins_status: string;
  ins_co_id: string;
  insurance_dealer?: string;
  saod_start_date?: string;
  saod_end_date?: string;
  inspection: 'yes' | 'no';

  // Customer Details
  branch_id: string;
  exicutive_name: string;
  customer: string;
  adh_id?: string;
  adh_file?: File;
  pan_no?: string;
  pan_file?: File;
  mobile_no?: string;
  mobile_no_two?: string;
  email?: string;
  city_id?: string;
  address_1?: string;

  // Existing file references (for editing - display only)
  existing_adh_file?: DriveFile | null;
  existing_pan_file?: DriveFile | null;

  // File deletion flags (for editing)
  adh_file_delete?: boolean;
  pan_file_delete?: boolean;

  // Nominee Details
  nominee_name?: string;
  nominee_dob?: string;
  nominee_relation?: string;

  // Vehicle Details
  product: string;
  manufacturer?: string;
  fuel_type?: string;
  hypothecation?: string;
  model_name?: string;
  mfg_date?: string;
  engine_no?: string;
  chassis_no?: string;
  registration_number: string;
  registration_date?: string;

  // Premium Details
  sum_insured?: number;
  cng_value?: number;
  od_premium?: number;
  ncb?: string;
  net_premium?: number;
  total_premium_gst?: number;
  addon_coverage?: string[];
  agent_commission?: number;
  date?: string;
  other_remark?: string;

  // Previous Policy Details
  has_previous_policy?: boolean;
  previous_policy_no?: string;
  previous_policy_company?: string;
  previous_policy_expiry_date?: string;
  previous_policy_ncb?: string;
  previous_policy_claim?: 'yes' | 'no';

  // Other Documents (for upload)
  other_documents?: Array<{
    file: File;
    label: string;
  }>;

  // Customer Payment
  premium_amount: number;
  customer_payment_type?: string;
  customer_payment_status: 'pending' | 'done';
  voucher_no?: number;
  payment_details: PaymentDetail[];
  extra_amount?: number;
  profit?: number;

  // Company Payment (formerly Krunal)
  company_payment_mode?: string;
  company_bank_name?: string;
  company_cheque_no?: string;
  company_amount?: number;
  company_cheque_date?: string;

  // System (optional for form)
  drive_folder_id?: string;
}

export interface PolicyListItem {
  id: string;
  serial_no: string;
  policy_no: string;
  customer: string;
  email?: string;
  mobile_no?: string;
  registration_number: string;
  ins_status: string;
  ins_co_id: string;
  customer_payment_status: string;
  premium_amount: number;
  net_premium: number;
  start_date: string;
  end_date: string;
  saod_end_date?: string; // ENSURE THIS IS PRESENT
  created_by?: { email: string; full_name?: string };
  created_at: string;
}

// Email attachment type for send modal
export interface PolicyAttachment {
  id: string;
  label: string;
  fileName: string;
  available: boolean;
}
