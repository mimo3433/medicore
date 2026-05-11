import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils/response';

export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      ResponseUtils.badRequest(res, 'Validation failed', errors);
      return;
    }

    next();
  };
};

export const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      ResponseUtils.badRequest(res, 'Query validation failed', errors);
      return;
    }

    next();
  };
};

export const validateParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      ResponseUtils.badRequest(res, 'Params validation failed', errors);
      return;
    }

    next();
  };
};
