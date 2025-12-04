import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  user_id: Types.ObjectId;
  action:
    | 'login'
    | 'logout'
    | 'create'
    | 'update'
    | 'delete'
    | 'export'
    | 'site_toggle'
    | 'role_change';
  resource_type?: 'policy' | 'meta' | 'user' | 'site_settings' | 'license'; // Changed from 'LicenseRecord' to 'license'
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'login',
        'logout',
        'create',
        'update',
        'delete',
        'export',
        'site_toggle',
        'role_change',
      ],
      required: true,
      index: true,
    },
    resource_type: {
      type: String,
      enum: ['policy', 'meta', 'user', 'site_settings', 'license'], // Matches interface now
      index: true,
    },
    resource_id: {
      type: String,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ip_address: {
      type: String,
    },
    user_agent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for common queries
AuditLogSchema.index({ user_id: 1, createdAt: -1 });
AuditLogSchema.index({ resource_type: 1, resource_id: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
