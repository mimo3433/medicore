import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils/response';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error({
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    ResponseUtils.badRequest(res, err.message);
    return;
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  ResponseUtils.serverError(res, 'Internal server error');
};

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
};
