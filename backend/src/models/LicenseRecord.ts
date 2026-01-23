import { Schema, model, Document, Types } from 'mongoose';

export interface ILicenseRecord extends Document {
  _id: Types.ObjectId;

  // License Details
  lic_no: string;
  application_no?: string;
  expiry_date: Date;
  customer_name?: string;
  customer_address?: string;
  dob?: Date;
  mobile_no?: string;
  aadhar_no?: string;
  reference?: string;
  reference_mobile_no?: string;

  // Financial
  fee?: number;
  agent_fee?: number;
  customer_payment?: number;
  profit?: number;

  // Status
  work_process?: string;
  approved: boolean;
  faceless_type: 'faceless' | 'non-faceless' | 'reminder';

  // Documents
  documents: Array<{
    file_id: string;
    file_name: string;
    original_name?: string;
    label?: string;
    mime_type: string;
    web_view_link: string;
    uploaded_at: Date;
  }>;

  // System
  created_by: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseDocumentSchema = new Schema(
  {
    file_id: { type: String, required: true, maxlength: 200 },
    file_name: { type: String, required: true, maxlength: 200 },
    original_name: { type: String, maxlength: 200 },
    label: { type: String, maxlength: 100 },
    mime_type: { type: String, required: true, maxlength: 100 },
    web_view_link: { type: String, required: true, maxlength: 500 },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LicenseRecordSchema = new Schema<ILicenseRecord>(
  {
    // Required fields
    lic_no: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
    },
    expiry_date: { type: Date, required: true },

    // Optional fields
    application_no: { type: String, trim: true, uppercase: true, maxlength: 50 },
    customer_name: { type: String, trim: true, uppercase: true, maxlength: 200 },
    customer_address: { type: String, uppercase: true, maxlength: 500 },
    dob: { type: Date },
    mobile_no: { type: String, trim: true, maxlength: 20 },
    aadhar_no: { type: String, trim: true, maxlength: 20 },
    reference: { type: String, trim: true, uppercase: true, maxlength: 200 },
    reference_mobile_no: { type: String, trim: true, maxlength: 20 },

    // Financial (optional with defaults)
    fee: { type: Number, default: 0, min: 0 },
    agent_fee: { type: Number, default: 0, min: 0 },
    customer_payment: { type: Number, default: 0, min: 0 },
    profit: { type: Number, default: 0 },

    // Status
    work_process: { type: String, uppercase: true, maxlength: 100 },
    approved: { type: Boolean, default: false },
    faceless_type: {
      type: String,
      enum: ['faceless', 'non-faceless', 'reminder'],
      default: 'non-faceless',
    },

    // Documents
    documents: [LicenseDocumentSchema],

    // System
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate profit before saving
LicenseRecordSchema.pre('save', function (next) {
  const fee = this.fee || 0;
  const agentFee = this.agent_fee || 0;
  const customerPayment = this.customer_payment || 0;
  this.profit = customerPayment - fee - agentFee;
  next();
});

// Indexes
LicenseRecordSchema.index({ expiry_date: 1 });
LicenseRecordSchema.index({ created_by: 1 });
LicenseRecordSchema.index({ customer_name: 'text', lic_no: 'text' });

export const LicenseRecord = model<ILicenseRecord>('LicenseRecord', LicenseRecordSchema);
