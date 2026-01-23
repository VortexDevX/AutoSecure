import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password_hash: string;
  role: 'owner' | 'admin' | 'user';
  totp_secret: string;
  totp_enabled: boolean;
  totp_verified: boolean;
  active: boolean;
  full_name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password_hash: {
      type: String,
      required: true,
      select: false,
      maxlength: 200,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'user'],
      default: 'user',
    },
    totp_secret: {
      type: String,
      required: true,
      select: false,
      maxlength: 100,
    },
    totp_enabled: {
      type: Boolean,
      default: false,
    },
    totp_verified: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    full_name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ role: 1, active: 1 });

// Don't return password_hash and totp_secret in JSON responses
UserSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.password_hash;
    delete ret.totp_secret;
    return ret;
  },
});

export const User = model<IUser>('User', UserSchema);
