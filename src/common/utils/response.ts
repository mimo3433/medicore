import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: any[];
}

export class ResponseUtils {
  static success<T>(res: Response, message: string, data?: T, meta?: any): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta,
    };
    return res.status(200).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(201).json(response);
  }

  static badRequest(res: Response, message: string, errors?: any[]): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
    };
    return res.status(400).json(response);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    const response: ApiResponse = {
      success: false,
      message,
    };
    return res.status(401).json(response);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    const response: ApiResponse = {
      success: false,
      message,
    };
    return res.status(403).json(response);
  }

  static notFound(res: Response, message: string = 'Resource not found'): Response {
    const response: ApiResponse = {
      success: false,
      message,
    };
    return res.status(404).json(response);
  }

  static conflict(res: Response, message: string): Response {
    const response: ApiResponse = {
      success: false,
      message,
    };
    return res.status(409).json(response);
  }

  static serverError(res: Response, message: string = 'Internal server error'): Response {
    const response: ApiResponse = {
      success: false,
      message,
    };
    return res.status(500).json(response);
  }
}
