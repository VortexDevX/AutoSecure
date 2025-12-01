import rateLimit from 'express-rate-limit';

// ✅ Detect environment
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Auth rate limiter - Prevents brute force attacks
 * Only counts FAILED login attempts (successful logins don't count)
 */
export const authRateLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // Dev: 5 min, Prod: 15 min
  max: isDevelopment ? 20 : 5, // Dev: 20 attempts, Prod: 5 attempts
  message: {
    status: 'error',
    message: isDevelopment
      ? 'Too many login attempts. Please try again in 5 minutes.'
      : 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ✅ Only count failed attempts
  skipFailedRequests: false,
  // ✅ Fixed handler with proper typing
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
 * Stricter than auth to prevent code guessing
 */
export const totpRateLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 5 * 60 * 1000, // 5 minutes (same for both)
  max: isDevelopment ? 10 : 5, // Dev: 10 attempts, Prod: 5 attempts
  message: {
    status: 'error',
    message: 'Too many TOTP verification attempts. Please try again in 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ✅ Only count failed attempts
  skipFailedRequests: false,
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
 * Applied to all routes globally
 */
export const apiRateLimiter = rateLimit({
  windowMs: isDevelopment
    ? 15 * 60 * 1000
    : parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: isDevelopment ? 500 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    status: 'error',
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // ✅ Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * File upload rate limiter
 * Prevents rapid file uploads
 */
export const uploadRateLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 1000, // 1 minute
  max: isDevelopment ? 50 : 10, // Dev: 50 uploads, Prod: 10 uploads
  message: {
    status: 'error',
    message: 'Too many file uploads. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all uploads
});

/**
 * Export rate limiter
 * Prevents excessive export requests (which can be resource-intensive)
 */
export const exportRateLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 1000, // 1 minute
  max: isDevelopment ? 20 : 5, // Dev: 20 exports, Prod: 5 exports
  message: {
    status: 'error',
    message: 'Too many export requests. Please wait before exporting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Email sending rate limiter
 * Prevents spam and excessive email usage
 */
export const emailRateLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 60 * 60 * 1000, // Dev: 5 min, Prod: 1 hour
  max: isDevelopment ? 50 : 10, // Dev: 50 emails, Prod: 10 emails per hour
  message: {
    status: 'error',
    message: 'Too many email requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
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
