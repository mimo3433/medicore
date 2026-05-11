import { Request, Response, NextFunction } from 'express';
import { CsvService } from './csv.service';
import { ResponseUtils } from '../../common/utils/response';
import path from 'path';

export class CsvController {
  private csvService: CsvService;

  constructor() {
    this.csvService = new CsvService();
  }

  exportAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const data = await this.csvService.exportAppointments(filters);
      const filename = await this.csvService.writeCsvFile(data, 'appointments.csv');
      
      res.download(path.join(process.cwd(), filename), 'appointments.csv');
    } catch (error) {
      next(error);
    }
  };

  exportDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const data = await this.csvService.exportDoctors(filters);
      const filename = await this.csvService.writeCsvFile(data, 'doctors.csv');
      
      res.download(path.join(process.cwd(), filename), 'doctors.csv');
    } catch (error) {
      next(error);
    }
  };

  exportPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const data = await this.csvService.exportPatients(filters);
      const filename = await this.csvService.writeCsvFile(data, 'patients.csv');
      
      res.download(path.join(process.cwd(), filename), 'patients.csv');
    } catch (error) {
      next(error);
    }
  };

  exportRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const data = await this.csvService.exportRevenue(filters);
      const filename = await this.csvService.writeCsvFile(data, 'revenue.csv');
      
      res.download(path.join(process.cwd(), filename), 'revenue.csv');
    } catch (error) {
      next(error);
    }
  };

  importDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        ResponseUtils.badRequest(res, 'No file uploaded');
        return;
      }

      const result = await this.csvService.importDoctors(file.path);
      ResponseUtils.created(res, 'Doctors imported successfully', result);
    } catch (error) {
      next(error);
    }
  };

  importPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        ResponseUtils.badRequest(res, 'No file uploaded');
        return;
      }

      const result = await this.csvService.importPatients(file.path);
      ResponseUtils.created(res, 'Patients imported successfully', result);
    } catch (error) {
      next(error);
    }
  };
}
