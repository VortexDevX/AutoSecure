import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/emailTemplateController';
import { requireAuth, requireOwner } from '../middleware/authMiddleware';

const router = Router();

// All email template routes require owner authentication
router.use(requireAuth, requireOwner);

router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', createTemplate);
router.patch('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
