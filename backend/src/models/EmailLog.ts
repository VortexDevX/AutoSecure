import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmailLog extends Document {
  _id: Types.ObjectId;
  policy_id?: Types.ObjectId;
  license_id?: Types.ObjectId;
  template_id: string;
  sent_to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  resend_id?: string;
  sent_by: Types.ObjectId;
  ip_address?: string;
  user_agent?: string;
  sent_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    policy_id: { type: Schema.Types.ObjectId, ref: 'Policy' },
    license_id: { type: Schema.Types.ObjectId, ref: 'LicenseRecord' },
    template_id: {
      type: String,
      required: true,
      index: true,
    },
    sent_to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },
    error_message: {
      type: String,
    },
    resend_id: {
      type: String,
    },
    sent_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ip_address: {
      type: String,
    },
    user_agent: {
      type: String,
    },
    sent_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for rate limiting checks
EmailLogSchema.index({ policy_id: 1, sent_at: -1 });
EmailLogSchema.index({ license_id: 1, sent_at: -1 });
EmailLogSchema.index({ sent_by: 1, sent_at: -1 });

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
