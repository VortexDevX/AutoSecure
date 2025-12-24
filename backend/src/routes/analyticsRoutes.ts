import { Router } from 'express';
import {
  getOverview,
  getPolicyAnalytics,
  getFinancialAnalytics,
  getCustomerAnalytics,
  getVehicleAnalytics,
  getTrends,
  getCustomAnalytics,
  getLicenseAnalytics,
  getBranchPerformance,
} from '../controllers/analyticsController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/policies', getPolicyAnalytics);
router.get('/licenses', getLicenseAnalytics);
router.get('/branches', getBranchPerformance);
router.get('/financial', getFinancialAnalytics);
router.get('/customers', getCustomerAnalytics);
router.get('/vehicles', getVehicleAnalytics);
router.get('/trends', getTrends);
router.post('/custom', getCustomAnalytics);

export default router;
