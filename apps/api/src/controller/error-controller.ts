import { sendApiResponse } from '@/lib/send-api-response';
import { ApiError } from '@repo/shared/api/api-error';
import { type ErrorRequestHandler } from 'express';

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const environment =
    process.env.NODE_ENV === 'development' ? 'development' : 'production';

  // Ensure error is an instance of ApiError for serialization
  const theError =
    err instanceof ApiError
      ? err
      : new ApiError(
          err.message || 'Unknown error',
          err.statusCode || 500,
          err.status || 'error',
          err.isOperational ?? false
        );

  sendApiResponse({
    res,
    status: theError.status === 'fail' ? 'fail' : 'error',
    statusCode: theError.statusCode,
    error: theError,
    environment,
  });
};
