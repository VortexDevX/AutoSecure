import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { PasswordService } from '../services/passwordService';
import { JWTService } from '../services/jwtService';
import { TOTPService } from '../services/totpService';
import { AuditService } from '../services/auditService';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/errors';
import { validateEmail } from '../utils/validators';

/**
 * POST /api/v1/auth/login
 * Step 1: Email + Password verification
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Find user (include password_hash and totp_secret for verification)
  const user = (await User.findOne({ email: email.toLowerCase() }).select(
    '+password_hash +totp_secret'
  )) as IUser | null;

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (!user.active) {
    throw new AuthenticationError('Account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await PasswordService.compare(password, user.password_hash);

  if (!isPasswordValid) {
    // Log failed login attempt
    await AuditService.log({
      user_id: user._id.toString(),
      action: 'login',
      details: { success: false, reason: 'Invalid password' },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    throw new AuthenticationError('Invalid email or password');
  }

  // Check if TOTP is enabled (this field should always be present now)
  console.log('🔍 TOTP Status:', {
    totp_enabled: user.totp_enabled,
    totp_verified: user.totp_verified,
  });

  // If TOTP not enabled, set it up
  if (!user.totp_enabled) {
    const totpData = await TOTPService.generateSecret(email);

    // Update user with TOTP secret
    user.totp_secret = totpData.secret;
    await user.save();

    console.log('✅ TOTP secret saved for', email);

    return res.json({
      status: 'success',
      message: 'TOTP setup required',
      totp_setup_required: true,
      totp_qr_code: totpData.qr_code,
      totp_secret: totpData.secret,
    });
  }

  // TOTP already enabled - require verification
  res.json({
    status: 'success',
    message: 'Password verified - TOTP verification required',
    totp_required: true,
    user_id: user._id.toString(),
  });
});

/**
 * POST /api/v1/auth/verify-totp
 * Step 2: TOTP verification
 */
export const verifyTOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, totp_code } = req.body;

  // Validate input
  if (!email || !totp_code) {
    throw new ValidationError('Email and TOTP code are required');
  }

  // Find user (need totp_secret for verification)
  const user = (await User.findOne({ email: email.toLowerCase() }).select(
    '+totp_secret'
  )) as IUser | null;

  if (!user) {
    throw new NotFoundError('User not found');
  }

  console.log('🔍 Verifying TOTP for:', email);
  console.log('   Current totp_enabled:', user.totp_enabled);
  console.log('   Current totp_verified:', user.totp_verified);

  // Verify TOTP
  const isValid = TOTPService.verify(totp_code, user.totp_secret);

  if (!isValid) {
    await AuditService.log({
      user_id: user._id.toString(),
      action: 'login',
      details: { success: false, reason: 'Invalid TOTP code' },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    throw new AuthenticationError('Invalid TOTP code');
  }

  // Enable TOTP if this is first successful verification
  if (!user.totp_verified) {
    user.totp_enabled = true;
    user.totp_verified = true;
    await user.save();

    console.log('✅ TOTP enabled for', email);
  }

  // Generate JWT tokens
  const tokens = JWTService.generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Log successful login
  await AuditService.logLogin(user._id.toString(), req.ip, req.headers['user-agent'], true);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      accessToken: tokens.accessToken,
    },
  });
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token required');
  }

  // Verify refresh token
  const payload = JWTService.verifyRefreshToken(refreshToken);

  // Verify user still exists and is active
  const user = (await User.findById(payload.userId)) as IUser | null;

  if (!user || !user.active) {
    throw new AuthenticationError('User not found or inactive');
  }

  // Generate new access token
  const newAccessToken = JWTService.generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.json({
    status: 'success',
    data: {
      accessToken: newAccessToken,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Logout user
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await AuditService.logLogout(req.user.userId, req.ip, req.headers['user-agent']);
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AuthenticationError('Not authenticated');
  }

  const user = (await User.findById(req.user.userId).select(
    'email role full_name active createdAt'
  )) as IUser | null;

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    status: 'success',
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        active: user.active,
        created_at: user.createdAt,
      },
    },
  });
});
