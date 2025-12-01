import { Schema, model, Document, Types } from 'mongoose';

export interface IMeta extends Document {
  _id: Types.ObjectId;
  category: string;
  value: string | number;
  label: string;
  active: boolean;
  sort_order: number;
  parent_value?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MetaSchema = new Schema<IMeta>(
  {
    category: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
    parent_value: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: category + value must be unique
MetaSchema.index({ category: 1, value: 1 }, { unique: true });

// Index for querying active options
MetaSchema.index({ category: 1, active: 1, sort_order: 1 });

// Index for dependent dropdowns
MetaSchema.index({ category: 1, parent_value: 1, active: 1 });

export const Meta = model<IMeta>('Meta', MetaSchema);
