import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../common/middleware/auth';

const router = Router();
const notificationController = new NotificationController();

router.get('/', authenticate, notificationController.getNotifications);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);

export default router;
