import { Router } from 'express';
import { DoctorController } from './doctor.controller';
import { authenticate, authorize } from '../../common/middleware/auth';

const router = Router();
const doctorController = new DoctorController();

// Public routes
router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/schedule', doctorController.getDoctorSchedule);
router.get('/:id/reviews', doctorController.getDoctorReviews);

// Doctor routes
router.post('/:id/reviews', authenticate, authorize('PATIENT'), doctorController.createReview);

router.get('/me/profile', authenticate, authorize('DOCTOR'), doctorController.getMyProfile);
router.put('/me/profile', authenticate, authorize('DOCTOR'), doctorController.updateProfile);
router.post('/me/documents', authenticate, authorize('DOCTOR'), doctorController.uploadDocument);

// Admin routes
router.put('/:id/verify', authenticate, authorize('ADMIN'), doctorController.verifyDoctor);

export default router;
