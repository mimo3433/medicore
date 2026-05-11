import { Request, Response, NextFunction } from 'express';
import { JwtUtils, TokenPayload } from '../utils/jwt';
import { ResponseUtils } from '../utils/response';
import prisma from '../../common/database/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseUtils.unauthorized(res, 'Access token required');
      return;
    }

    const token = authHeader.substring(7);
    const payload = JwtUtils.verifyAccessToken(token);

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      ResponseUtils.unauthorized(res, 'User not found or inactive');
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    ResponseUtils.unauthorized(res, 'Invalid or expired token');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtils.unauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      ResponseUtils.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = JwtUtils.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next();
  }
};
