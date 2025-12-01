import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmailTemplate extends Document {
  _id: Types.ObjectId;
  template_id: string;
  name: string;
  subject: string;
  body_html: string;
  active: boolean;
  created_by: Types.ObjectId;
  updated_by: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    template_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body_html: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active templates lookup
EmailTemplateSchema.index({ template_id: 1, active: 1 });

export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
