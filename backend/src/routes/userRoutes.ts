import { Router } from 'express';
import {
  createUser,
  listUsers,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
} from '../controllers/userController';
import { requireAuth, requireAdmin, requireOwner } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Admin/Owner routes
router.post('/', requireAdmin, createUser);
router.get('/', requireAdmin, listUsers);
router.patch('/:id/status', requireAdmin, toggleUserStatus);

// Owner-only routes
router.patch('/:id/role', requireOwner, changeUserRole);
router.delete('/:id', requireOwner, deleteUser);

export default router;
