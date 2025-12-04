export interface LicenseDocument {
  file_id: string;
  file_name: string;
  original_name?: string; // Optional for old records
  label?: string; // Optional for old records
  mime_type: string;
  web_view_link: string;
  uploaded_at: string;
}

export interface LicenseRecord {
  _id: string;
  lic_no: string;
  application_no?: string;
  expiry_date: string;
  customer_name?: string;
  customer_address?: string;
  dob?: string;
  mobile_no?: string;
  aadhar_no?: string;
  reference?: string;
  reference_mobile_no?: string;
  fee: number;
  agent_fee: number;
  customer_payment: number;
  profit: number;
  work_process?: string;
  approved: boolean;
  faceless_type: 'faceless' | 'non-faceless' | 'reminder';
  documents: LicenseDocument[];
  created_by: { email: string; full_name?: string };
  createdAt: string;
  updatedAt: string;
}

export interface LicenseFormData {
  lic_no: string;
  application_no?: string;
  expiry_date: string;
  customer_name?: string;
  customer_address?: string;
  dob?: string;
  mobile_no?: string;
  aadhar_no?: string;
  reference?: string;
  reference_mobile_no?: string;
  fee?: number;
  agent_fee?: number;
  customer_payment?: number;
  work_process?: string;
  approved?: boolean;
  faceless_type?: 'faceless' | 'non-faceless' | 'reminder';
  // Documents with labels
  documents?: Array<{
    file: File;
    label: string;
  }>;
  existing_documents?: LicenseDocument[];
}
