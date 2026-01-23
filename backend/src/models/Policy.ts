import { Schema, model, Document, Types } from 'mongoose';

export interface IDriveFile {
  file_id: string;
  file_name: string;
  mime_type: string;
  web_view_link: string;
  uploaded_at: Date;
}

export interface IPaymentDetail {
  payment_mode: string;
  collect_amount: number;
  collect_remark?: string;
}

export interface IPolicy extends Document {
  _id: Types.ObjectId;

  // Policy Details
  serial_no: string;
  policy_no: string;
  issue_date: Date;
  ins_type: string;
  start_date: Date;
  end_date: Date;
  ins_status: string;
  ins_co_id: string;
  insurance_dealer?: string;
  saod_start_date?: Date;
  saod_end_date?: Date;
  inspection: 'yes' | 'no';

  // Customer Details
  branch_id: string;
  created_by: Types.ObjectId;
  exicutive_name: string;
  customer: string;
  adh_id?: string;
  adh_file?: IDriveFile;
  pan_no?: string;
  pan_file?: IDriveFile;
  mobile_no?: string;
  mobile_no_two?: string;
  email?: string;
  city_id?: string;
  address_1?: string;

  // Nominee Details
  nominee_name?: string;
  nominee_dob?: Date;
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
  registration_date?: Date;

  // Premium Details
  sum_insured?: number;
  cng_value?: number;
  od_premium?: number; // ✅ RENAMED from discounted_value
  ncb?: string;
  net_premium?: number;
  total_premium_gst?: number; // ✅ RENAMED from on_date_premium
  addon_coverage?: string[];
  agent_commission?: number;
  date?: Date;
  other_remark?: string;

  // Previous Policy Details
  previous_policy_no?: string;
  previous_policy_company?: string;
  previous_policy_expiry_date?: Date;
  previous_policy_ncb?: string;
  previous_policy_claim?: 'yes' | 'no';

  // Other Documents
  other_documents?: Array<{
    file_id: string;
    file_name: string;
    label: string;
    mime_type: string;
    web_view_link: string;
    uploaded_at: Date;
  }>;

  // Customer Payment
  premium_amount: number;
  customer_payment_type?: string;
  customer_payment_status: 'pending' | 'done';
  voucher_no?: number;
  payment_details: IPaymentDetail[];
  extra_amount?: number; // ✅ Now auto-calculated
  profit?: number; // ✅ NEW: Auto-calculated field

  // Company Payment (formerly Krunal)
  company_payment_mode?: string;
  company_bank_name?: string;
  company_cheque_no?: string;
  company_amount?: number;
  company_cheque_date?: Date;

  // System
  drive_folder_id: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriveFileSchema = new Schema<IDriveFile>(
  {
    file_id: { type: String, required: true },
    file_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    web_view_link: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaymentDetailSchema = new Schema<IPaymentDetail>(
  {
    payment_mode: { type: String, required: true },
    collect_amount: { type: Number, required: true, min: 0 },
    collect_remark: { type: String },
  },
  { _id: false }
);

const OtherDocumentSchema = new Schema(
  {
    file_id: { type: String, required: true },
    file_name: { type: String, required: true },
    label: { type: String, required: true },
    mime_type: { type: String, required: true },
    web_view_link: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PolicySchema = new Schema<IPolicy>(
  {
    // Policy Details
    serial_no: { type: String, required: true, unique: true, maxlength: 50 },
    policy_no: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    issue_date: { type: Date, required: true },
    ins_type: { type: String, required: true, maxlength: 50 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    ins_status: { type: String, required: true, maxlength: 50 },
    ins_co_id: { type: String, required: true, maxlength: 100 },
    insurance_dealer: { type: String, maxlength: 100 },
    saod_start_date: { type: Date },
    saod_end_date: { type: Date },
    inspection: { type: String, enum: ['yes', 'no'], required: true },

    // Customer Details
    branch_id: { type: String, required: true, maxlength: 100 },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    exicutive_name: { type: String, required: true, maxlength: 100 },
    customer: { type: String, required: true, trim: true, maxlength: 200 },
    adh_id: { type: String, maxlength: 20 },
    adh_file: DriveFileSchema,
    pan_no: { type: String, uppercase: true, maxlength: 20 },
    pan_file: DriveFileSchema,
    mobile_no: { type: String, maxlength: 20 },
    mobile_no_two: { type: String, maxlength: 20 },
    email: { type: String, lowercase: true, maxlength: 255 },
    city_id: { type: String, maxlength: 100 },
    address_1: { type: String, maxlength: 500 },

    // Nominee Details
    nominee_name: { type: String, trim: true, maxlength: 200 },
    nominee_dob: { type: Date },
    nominee_relation: { type: String, maxlength: 50 },

    // Vehicle Details
    product: { type: String, required: true, maxlength: 100 },
    manufacturer: { type: String, maxlength: 100 },
    fuel_type: { type: String, maxlength: 50 },
    hypothecation: { type: String, maxlength: 200 },
    model_name: { type: String, maxlength: 100 },
    mfg_date: { type: String, maxlength: 20 },
    engine_no: { type: String, trim: true, uppercase: true, maxlength: 50 },
    chassis_no: { type: String, trim: true, uppercase: true, maxlength: 50 },
    registration_number: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    registration_date: { type: Date },

    // Premium Details
    sum_insured: { type: Number, min: 0 },
    cng_value: { type: Number, min: 0 },
    od_premium: { type: Number, min: 0 },
    ncb: { type: String, maxlength: 20 },
    net_premium: { type: Number, min: 0 },
    total_premium_gst: { type: Number, min: 0 },
    addon_coverage: [{ type: String, maxlength: 100 }],
    agent_commission: { type: Number, min: 0 },
    date: { type: Date },
    other_remark: { type: String, maxlength: 1000 },

    // Previous Policy Details
    previous_policy_no: { type: String, maxlength: 100 },
    previous_policy_company: { type: String, maxlength: 100 },
    previous_policy_expiry_date: { type: Date },
    previous_policy_ncb: { type: String, maxlength: 20 },
    previous_policy_claim: { type: String, enum: ['yes', 'no'] },

    // Other Documents
    other_documents: [OtherDocumentSchema],

    // Customer Payment
    premium_amount: { type: Number, required: true, min: 0 },
    customer_payment_type: { type: String, maxlength: 50 },
    customer_payment_status: { type: String, enum: ['pending', 'done'], required: true },
    voucher_no: { type: Number },
    payment_details: [PaymentDetailSchema],
    extra_amount: { type: Number },
    profit: { type: Number },

    // Company Payment (formerly Krunal)
    company_payment_mode: { type: String, maxlength: 50 },
    company_bank_name: { type: String, maxlength: 100 },
    company_cheque_no: { type: String, maxlength: 50 },
    company_amount: { type: Number, min: 0 },
    company_cheque_date: { type: Date },

    // System
    drive_folder_id: { type: String, required: true, maxlength: 200 },
  },
  {
    timestamps: true,
  }
);

// Indexes
PolicySchema.index({ customer: 'text', email: 'text', registration_number: 'text' });
PolicySchema.index({ created_by: 1 });
PolicySchema.index({ branch_id: 1 });
PolicySchema.index({ createdAt: -1 });
PolicySchema.index({ customer_payment_status: 1 });
PolicySchema.index({ ins_status: 1 });
PolicySchema.index({ issue_date: -1 });
PolicySchema.index({ end_date: -1 });
PolicySchema.index({ saod_end_date: -1 });

export const Policy = model<IPolicy>('Policy', PolicySchema);
