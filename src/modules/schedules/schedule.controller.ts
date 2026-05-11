import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from './schedule.service';
import { ResponseUtils } from '../../common/utils/response';

export class ScheduleController {
  private scheduleService: ScheduleService;

  constructor() {
    this.scheduleService = new ScheduleService();
  }

  createSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const data = req.body;
      const result = await this.scheduleService.createSchedule(userId, data);
      ResponseUtils.created(res, 'Schedule created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const data = req.body;
      const result = await this.scheduleService.updateSchedule(id, userId, data);
      ResponseUtils.success(res, 'Schedule updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      await this.scheduleService.deleteSchedule(id, userId);
      ResponseUtils.success(res, 'Schedule deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const result = await this.scheduleService.getSchedules(userId);
      ResponseUtils.success(res, 'Schedules retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  generateSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.body;
      const result = await this.scheduleService.generateSlots(id, startDate, endDate);
      ResponseUtils.created(res, 'Slots generated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  blockDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const data = req.body;
      const result = await this.scheduleService.blockDate(userId, data);
      ResponseUtils.created(res, 'Date blocked successfully', result);
    } catch (error) {
      next(error);
    }
  };

  unblockDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      await this.scheduleService.unblockDate(id, userId);
      ResponseUtils.success(res, 'Date unblocked successfully');
    } catch (error) {
      next(error);
    }
  };

  getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      const result = await this.scheduleService.getAvailableSlots(doctorId, date as string);
      ResponseUtils.success(res, 'Available slots retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };
}
