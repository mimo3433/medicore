import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from './appointment.service';
import { ResponseUtils } from '../../common/utils/response';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  bookAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const data = req.body;
      const result = await this.appointmentService.bookAppointment(userId, data);
      ResponseUtils.created(res, 'Appointment booked successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getMyAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const filters = req.query;
      const result = await this.appointmentService.getMyAppointments(userId, filters);
      ResponseUtils.success(res, 'Appointments retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const result = await this.appointmentService.getAppointmentById(id, userId);
      ResponseUtils.success(res, 'Appointment retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const result = await this.appointmentService.cancelAppointment(id, userId);
      ResponseUtils.success(res, 'Appointment cancelled successfully', result);
    } catch (error) {
      next(error);
    }
  };

  rescheduleAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { newSlotId } = req.body;
      const result = await this.appointmentService.rescheduleAppointment(id, userId, newSlotId);
      ResponseUtils.success(res, 'Appointment rescheduled successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getDoctorAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const filters = req.query;
      const result = await this.appointmentService.getDoctorAppointments(userId, filters);
      ResponseUtils.success(res, 'Doctor appointments retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { status } = req.body;
      const result = await this.appointmentService.updateAppointmentStatus(id, userId, status);
      ResponseUtils.success(res, 'Appointment status updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  completeAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { notes } = req.body;
      const result = await this.appointmentService.completeAppointment(id, userId, notes);
      ResponseUtils.success(res, 'Appointment completed successfully', result);
    } catch (error) {
      next(error);
    }
  };
}
