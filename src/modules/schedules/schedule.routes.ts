import { Router } from 'express';
import { ScheduleController } from './schedule.controller';
import { authenticate, authorize } from '../../common/middleware/auth';

const router = Router();
const scheduleController = new ScheduleController();

// Doctor routes
router.post('/', authenticate, authorize('DOCTOR'), scheduleController.createSchedule);
router.get('/', authenticate, authorize('DOCTOR'), scheduleController.getSchedules);
router.put('/:id', authenticate, authorize('DOCTOR'), scheduleController.updateSchedule);
router.delete('/:id', authenticate, authorize('DOCTOR'), scheduleController.deleteSchedule);
router.post('/:id/generate-slots', authenticate, authorize('DOCTOR'), scheduleController.generateSlots);
router.post('/block-date', authenticate, authorize('DOCTOR'), scheduleController.blockDate);
router.delete('/block-date/:id', authenticate, authorize('DOCTOR'), scheduleController.unblockDate);

// Public routes
router.get('/:doctorId/available', scheduleController.getAvailableSlots);

export default router;
