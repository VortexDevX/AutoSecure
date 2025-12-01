import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// ✅ Detect environment
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Generate a unique key for rate limiting
 * Uses IP + User ID (if authenticated) for better accuracy
 */
const getKey = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = (req as any).user?.userId;

  if (userId) {
    return `${ip}-${userId}`;
  }
  return ip;
};

/**
 * Auth rate limiter - Prevents brute force attacks
 * Only counts FAILED login attempts
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 10, // Dev: 50, Prod: 10 failed attempts per 15 min
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ✅ Only count failed attempts
  skipFailedRequests: false,
  keyGenerator: getKey,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60) : 15;

    res.status(429).json({
      status: 'error',
      message: `Too many login attempts. Please try again in ${retryAfter} minute(s).`,
      retryAfter: retryAfter,
    });
  },
});

/**
 * TOTP verification rate limiter
 * Stricter to prevent code guessing
 */
export const totpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDevelopment ? 20 : 10, // Dev: 20, Prod: 10 attempts per 5 min
  message: {
    status: 'error',
    message: 'Too many TOTP verification attempts. Please try again in 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ✅ Only count failed attempts
  skipFailedRequests: false,
  keyGenerator: getKey,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60) : 5;

    res.status(429).json({
      status: 'error',
      message: `Too many TOTP attempts. Please try again in ${retryAfter} minute(s).`,
      retryAfter: retryAfter,
    });
  },
});

/**
 * General API rate limiter
 * Applied to all routes globally - VERY GENEROUS limits
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window (shorter window = faster reset)
  max: isDevelopment ? 1000 : 300, // Dev: 1000, Prod: 300 requests per minute
  message: {
    status: 'error',
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getKey,
  skip: (req) => {
    // Skip rate limiting for health checks
    const path = req.path.toLowerCase();
    return path === '/health' || path === '/api/health' || path.includes('/health');
  },
});

/**
 * File upload rate limiter
 * Prevents rapid file uploads
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 100 : 30, // Dev: 100, Prod: 30 uploads per minute
  message: {
    status: 'error',
    message: 'Too many file uploads. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getKey,
});

/**
 * Export rate limiter
 * Prevents excessive export requests
 */
export const exportRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 50 : 20, // Dev: 50, Prod: 20 exports per minute
  message: {
    status: 'error',
    message: 'Too many export requests. Please wait before exporting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getKey,
});

/**
 * Email sending rate limiter
 * More generous for business use
 */
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 100 : 50, // Dev: 100, Prod: 50 emails per hour per user
  message: {
    status: 'error',
    message: 'Email rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getKey,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60) : 60;

    res.status(429).json({
      status: 'error',
      message: `Email rate limit exceeded. Please try again in ${retryAfter} minute(s).`,
      retryAfter: retryAfter,
    });
  },
});

/**
 * Create custom rate limiter with specific settings
 */
export const createRateLimiter = (options: { windowMs: number; max: number; message?: string }) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: isDevelopment ? options.max * 5 : options.max,
    message: {
      status: 'error',
      message: options.message || 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getKey,
  });
};
