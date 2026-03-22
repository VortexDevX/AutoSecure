import { Router } from 'express';
import {
  createUser,
  listUsers,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
  updateMe,
  changePassword,
} from '../controllers/userController';
import { requireAuth, requireAdmin, requireOwner } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Profile routes (User themselves)
router.patch('/me', updateMe);
router.patch('/me/password', changePassword);

// Admin/Owner routes
router.post('/', requireAdmin, createUser);
router.get('/', requireAdmin, listUsers);
router.patch('/:id/status', requireAdmin, toggleUserStatus);

// Owner-only routes
router.patch('/:id/role', requireOwner, changeUserRole);
router.delete('/:id', requireOwner, deleteUser);

export default router;
