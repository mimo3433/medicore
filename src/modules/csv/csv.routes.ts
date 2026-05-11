import { Router } from 'express';
import { CsvController } from './csv.controller';
import { authenticate, authorize } from '../../common/middleware/auth';
import multer from 'multer';

const router = Router();
const csvController = new CsvController();

const upload = multer({ dest: 'uploads/' });

// Export routes (Admin only)
router.get('/export/appointments', authenticate, authorize('ADMIN'), csvController.exportAppointments);
router.get('/export/doctors', authenticate, authorize('ADMIN'), csvController.exportDoctors);
router.get('/export/patients', authenticate, authorize('ADMIN'), csvController.exportPatients);
router.get('/export/revenue', authenticate, authorize('ADMIN'), csvController.exportRevenue);

// Import routes (Admin only)
router.post('/import/doctors', authenticate, authorize('ADMIN'), upload.single('file'), csvController.importDoctors);
router.post('/import/patients', authenticate, authorize('ADMIN'), upload.single('file'), csvController.importPatients);

export default router;
