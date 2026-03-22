import { Router } from 'express';
import {
  login,
  verifyTOTP,
  refreshToken,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
import { authRateLimiter, totpRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes with rate limiting
router.post('/login', authRateLimiter, login);
router.post('/verify-totp', totpRateLimiter, verifyTOTP);
router.post('/refresh', refreshToken);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

// Protected routes
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
