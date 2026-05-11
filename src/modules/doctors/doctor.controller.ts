import { Request, Response, NextFunction } from 'express';
import { DoctorService } from './doctor.service';
import { ResponseUtils } from '../../common/utils/response';

export class DoctorController {
  private doctorService: DoctorService;

  constructor() {
    this.doctorService = new DoctorService();
  }

  getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const result = await this.doctorService.getDoctors(filters);
      ResponseUtils.success(res, 'Doctors retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.doctorService.getDoctorById(id);
      ResponseUtils.success(res, 'Doctor retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const data = req.body;
      const result = await this.doctorService.updateProfile(userId, data);
      ResponseUtils.success(res, 'Profile updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const documentData = req.body;
      const result = await this.doctorService.uploadDocument(userId, documentData);
      ResponseUtils.created(res, 'Document uploaded successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const result = await this.doctorService.getMyProfile(userId);
      ResponseUtils.success(res, 'Profile retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getDoctorSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      const result = await this.doctorService.getDoctorSchedule(doctorId, date as string);
      ResponseUtils.success(res, 'Schedule retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  verifyDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.params;
      const result = await this.doctorService.verifyDoctor(doctorId);
      ResponseUtils.success(res, 'Doctor verified successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getDoctorReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.doctorService.getDoctorReviews(id);
      ResponseUtils.success(res, 'Reviews retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseUtils.unauthorized(res, 'Authentication required');
        return;
      }
      const { id } = req.params;
      const { rating, comment } = req.body;
      const result = await this.doctorService.createReview(userId, id, parseInt(rating), comment);
      ResponseUtils.created(res, 'Review created successfully', result);
    } catch (error) {
      next(error);
    }
  };
}
