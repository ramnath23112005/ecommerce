import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/AppError';
import logger from '../utils/logger';
import { config } from '../config';
import { IAPIResponse } from '../../shared/types';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response<IAPIResponse>,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  let errors: Record<string, string[]> | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    const mongooseErr = err as any;
    errors = Object.keys(mongooseErr.errors).reduce((acc: Record<string, string[]>, key: string) => {
      acc[key] = [mongooseErr.errors[key].message];
      return acc;
    }, {});
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  }

  if ((err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyValue)[0];
    message = `Duplicate value for ${field}`;
    code = 'DUPLICATE_KEY';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  logger.error(`${statusCode} - ${message}`, {
    error: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  const response: IAPIResponse = {
    success: false,
    message,
    error: code,
    ...(errors && { data: { errors } }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (_req: Request, res: Response<IAPIResponse>): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
  });
};
