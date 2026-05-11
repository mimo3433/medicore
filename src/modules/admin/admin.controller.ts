import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ResponseUtils } from '../../common/utils/response';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminService.getDashboard();
      ResponseUtils.success(res, 'Dashboard data retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const result = await this.adminService.getUsers(filters);
      ResponseUtils.success(res, 'Users retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const result = await this.adminService.updateUserStatus(id, isActive);
      ResponseUtils.success(res, 'User status updated', result);
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period } = req.query;
      const result = await this.adminService.getAnalytics(period as string);
      ResponseUtils.success(res, 'Analytics retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const result = await this.adminService.getAuditLogs(filters);
      ResponseUtils.success(res, 'Audit logs retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  getRefunds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const result = await this.adminService.getRefunds(filters);
      ResponseUtils.success(res, 'Refunds retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  processRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const result = await this.adminService.processRefund(paymentId);
      ResponseUtils.success(res, 'Refund processed', result);
    } catch (error) {
      next(error);
    }
  };
}
