import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { ResponseUtils } from '../../common/utils/response';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const filters = req.query;
      const result = await this.notificationService.getUserNotifications(userId, filters);
      ResponseUtils.success(res, 'Notifications retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const result = await this.notificationService.markAsRead(id, userId);
      ResponseUtils.success(res, 'Notification marked as read', result);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const result = await this.notificationService.markAllAsRead(userId);
      ResponseUtils.success(res, 'All notifications marked as read', result);
    } catch (error) {
      next(error);
    }
  };
}
