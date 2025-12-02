import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

// Detect environment
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Safe key generator using IPv6-aware helper
 * Adds userId when available
 */
const getSafeKey = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const base = ipKeyGenerator(ip); // IPv6 normalized
  const userId = (req as any).user?.userId;
  return userId ? `${base}-${userId}` : base;
};

/**
 * Auth rate limiter
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 200 : 50, // Increased significantly
  message: {
    status: 'error',
    message: 'Too many login attempts. Try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: getSafeKey,
});

/**
 * TOTP rate limiter
 */
export const totpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDevelopment ? 100 : 40, // Increased
  message: {
    status: 'error',
    message: 'Too many TOTP attempts. Try again soon.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: getSafeKey,
});

/**
 * Global API limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 5000 : 1500, // Massive increase
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getSafeKey,
  skip: (req) => {
    const p = req.path.toLowerCase();
    return p.includes('/health');
  },
});

/**
 * Upload limiter
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 300 : 120, // Increased
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getSafeKey,
});

/**
 * Export limiter
 */
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 200 : 80, // Increased
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getSafeKey,
});

/**
 * Email limiter
 */
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDevelopment ? 500 : 200, // Increased heavily
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getSafeKey,
});

/**
 * Custom limiter generator
 */
export const createRateLimiter = (options: { windowMs: number; max: number; message?: string }) =>
  rateLimit({
    windowMs: options.windowMs,
    max: isDevelopment ? options.max * 5 : options.max * 2,
    message: {
      status: 'error',
      message: options.message || 'Too many requests.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getSafeKey,
  });
