import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate, authorize } from '../../common/middleware/auth';

const router = Router();
const paymentController = new PaymentController();

// Public webhook endpoint (no auth required)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.post('/intent', authenticate, paymentController.createPaymentIntent);
router.post('/confirm', authenticate, paymentController.confirmPayment);
router.get('/history', authenticate, authorize('PATIENT'), paymentController.getPaymentHistory);
router.get('/:id', authenticate, paymentController.getPaymentById);
router.post('/:id/refund', authenticate, authorize('ADMIN', 'DOCTOR'), paymentController.refundPayment);

export default router;
