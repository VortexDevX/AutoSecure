import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwtService';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/User';

/**
 * Extract token from request headers or cookies
 */
const extractToken = (req: Request): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Middleware: Verify JWT and attach user to request
 */
export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    throw new AuthenticationError('No authentication token provided');
  }

  // Verify token
  const payload = JWTService.verifyAccessToken(token);

  // Verify user still exists and is active
  const user = await User.findById(payload.userId).select(
    'email role active totp_enabled totp_verified'
  );

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (!user.active) {
    throw new AuthenticationError('Account has been deactivated');
  }

  // Attach user payload to request
  req.user = payload;

  next();
});

/**
 * Middleware: Require owner role
 */
export const requireOwner = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.role !== 'owner') {
      throw new AuthorizationError('Owner access required');
    }

    next();
  }
);

/**
 * Middleware: Require admin or owner role
 */
export const requireAdmin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    next();
  }
);

/**
 * Middleware: Require any authenticated user
 */
export const requireUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  next();
});
