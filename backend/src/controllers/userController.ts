import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { PasswordService } from '../services/passwordService';
import { TOTPService } from '../services/totpService';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';
import { validateEmail } from '../utils/validators';
import speakeasy from 'speakeasy';

/**
 * POST /api/v1/users
 * Create new user (Admin/Owner only)
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role, full_name } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Validate role
  const validRoles = ['user', 'admin', 'owner'];
  if (role && !validRoles.includes(role)) {
    throw new ValidationError('Invalid role');
  }

  // Only owner can create other owners
  if (role === 'owner' && req.user?.role !== 'owner') {
    throw new AuthorizationError('Only owner can create owner accounts');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const passwordHash = await PasswordService.hash(password);

  // Generate TOTP secret
  const totpSecret = speakeasy.generateSecret({ length: 20 });

  // Create user
  const user = (await User.create({
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role: role || 'user',
    totp_secret: totpSecret.base32,
    totp_enabled: false,
    totp_verified: false,
    active: true,
    full_name,
  })) as IUser;

  // Audit log
  await AuditService.logCreate(req.user!.userId, 'user', user._id.toString(), {
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        active: user.active,
      },
    },
  });
});

/**
 * GET /api/v1/users
 * List all users (Admin/Owner only)
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = (await User.find()
    .select('email role full_name active totp_enabled totp_verified createdAt updatedAt') // ✅ ADDED totp_enabled, totp_verified
    .sort({ createdAt: -1 })) as IUser[];

  res.json({
    status: 'success',
    data: {
      users: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        active: user.active,
        totp_enabled: user.totp_enabled, // ✅ ADDED
        totp_verified: user.totp_verified, // ✅ ADDED
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })),
      count: users.length,
    },
  });
});

/**
 * PATCH /api/v1/users/:id/role
 * Change user role (Owner only)
 */
export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate role
  const validRoles = ['user', 'admin', 'owner'];
  if (!role || !validRoles.includes(role)) {
    throw new ValidationError('Invalid role');
  }

  // Find user
  const user = (await User.findById(id)) as IUser | null;
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Cannot change own role
  if (user._id.toString() === req.user!.userId) {
    throw new ValidationError('Cannot change your own role');
  }

  const oldRole = user.role;

  // Update role
  user.role = role;
  await user.save();

  // Audit log
  await AuditService.logRoleChange(req.user!.userId, user._id.toString(), oldRole, role);

  res.json({
    status: 'success',
    message: 'User role updated successfully',
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    },
  });
});

/**
 * PATCH /api/v1/users/:id/status
 * Activate/deactivate user (Owner/Admin only)
 */
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { active } = req.body;

  if (typeof active !== 'boolean') {
    throw new ValidationError('Active status must be boolean');
  }

  // Find user
  const user = (await User.findById(id)) as IUser | null;
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Cannot deactivate own account
  if (user._id.toString() === req.user!.userId) {
    throw new ValidationError('Cannot deactivate your own account');
  }

  // Cannot deactivate owner (unless you are owner)
  if (user.role === 'owner' && req.user!.role !== 'owner') {
    throw new AuthorizationError('Cannot deactivate owner account');
  }

  // Update status
  user.active = active;
  await user.save();

  // Audit log
  await AuditService.logUpdate(req.user!.userId, 'user', user._id.toString(), {
    active,
    action: active ? 'activated' : 'deactivated',
  });

  res.json({
    status: 'success',
    message: `User ${active ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        active: user.active,
      },
    },
  });
});

/**
 * DELETE /api/v1/users/:id
 * Delete user (Owner only)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Find user
  const user = (await User.findById(id)) as IUser | null;
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Cannot delete own account
  if (user._id.toString() === req.user!.userId) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Cannot delete owner
  if (user.role === 'owner') {
    throw new ValidationError('Cannot delete owner account');
  }

  // Audit log before deletion
  await AuditService.logDelete(req.user!.userId, 'user', user._id.toString(), {
    email: user.email,
    role: user.role,
  });

  // Delete user
  await user.deleteOne();

  res.json({
    status: 'success',
    message: 'User deleted successfully',
  });
});
