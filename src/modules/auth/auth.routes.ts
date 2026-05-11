import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../common/middleware/auth';
import { authRateLimit } from '../../common/middleware/rateLimit';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authRateLimit, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);

export default router;
