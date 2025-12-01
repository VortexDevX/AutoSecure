import { Router } from 'express';
import {
  getCategories,
  getOptionsByCategory,
  createOption,
  updateOption,
  updateSortOrder,
  deleteOption,
  reorderOptions,
} from '../controllers/metaController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Public (authenticated) routes - for dropdowns
router.get('/categories', getCategories);
router.get('/:category', getOptionsByCategory);

// Admin routes - for management
router.post('/', requireAdmin, createOption);
router.patch('/:id', requireAdmin, updateOption);
router.patch('/:id/order', requireAdmin, updateSortOrder);
router.delete('/:id', requireAdmin, deleteOption);
router.post('/reorder', requireAdmin, reorderOptions);

export default router;
