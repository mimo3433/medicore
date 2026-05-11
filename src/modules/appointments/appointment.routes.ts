import { Router } from 'express';
import { AppointmentController } from './appointment.controller';
import { authenticate, authorize } from '../../common/middleware/auth';

const router = Router();
const appointmentController = new AppointmentController();

// Patient routes
router.post('/', authenticate, authorize('PATIENT'), appointmentController.bookAppointment);
router.get('/my', authenticate, authorize('PATIENT'), appointmentController.getMyAppointments);
router.get('/my/:id', authenticate, authorize('PATIENT'), appointmentController.getAppointmentById);
router.put('/:id/cancel', authenticate, authorize('PATIENT'), appointmentController.cancelAppointment);
router.put('/:id/reschedule', authenticate, authorize('PATIENT'), appointmentController.rescheduleAppointment);

// Doctor routes
router.get('/doctor', authenticate, authorize('DOCTOR'), appointmentController.getDoctorAppointments);
router.put('/:id/status', authenticate, authorize('DOCTOR'), appointmentController.updateAppointmentStatus);
router.put('/:id/complete', authenticate, authorize('DOCTOR'), appointmentController.completeAppointment);

// Admin routes
router.get('/:id', authenticate, authorize('ADMIN'), appointmentController.getAppointmentById);

export default router;
