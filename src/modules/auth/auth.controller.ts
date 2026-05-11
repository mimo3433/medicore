import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseUtils } from '../../common/utils/response';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, role, ...profileData } = req.body;
      const result = await this.authService.register(email, password, role, profileData);
      ResponseUtils.created(res, 'Registration successful', result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      ResponseUtils.success(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      ResponseUtils.success(res, 'Token refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await this.authService.logout(refreshToken, req.user?.userId);
      ResponseUtils.success(res, 'Logout successful');
    } catch (error) {
      // Always return success on logout - client will clear local auth state
      ResponseUtils.success(res, 'Logout successful');
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        ResponseUtils.unauthorized(res, 'User not authenticated');
        return;
      }
      await this.authService.logoutAll(req.user.userId);
      ResponseUtils.success(res, 'Logged out from all devices');
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);
      ResponseUtils.success(res, 'Password reset email sent');
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);
      ResponseUtils.success(res, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      await this.authService.verifyEmail(token);
      ResponseUtils.success(res, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        ResponseUtils.unauthorized(res, 'User not authenticated');
        return;
      }
      const user = await this.authService.getMe(req.user.userId);
      ResponseUtils.success(res, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  };
}
