import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorize } from '../../common/middleware/auth';

const router = Router();
const adminController = new AdminController();

router.get('/dashboard', authenticate, authorize('ADMIN'), adminController.getDashboard);
router.get('/users', authenticate, authorize('ADMIN'), adminController.getUsers);
router.put('/users/:id/status', authenticate, authorize('ADMIN'), adminController.updateUserStatus);
router.get('/analytics', authenticate, authorize('ADMIN'), adminController.getAnalytics);
router.get('/audit-logs', authenticate, authorize('ADMIN'), adminController.getAuditLogs);
router.get('/refunds', authenticate, authorize('ADMIN'), adminController.getRefunds);
router.post('/refunds/:paymentId', authenticate, authorize('ADMIN'), adminController.processRefund);

export default router;
