/* eslint-disable @typescript-eslint/no-explicit-any */

import { ApiError } from '@repo/shared/api/api-error';
import type { ApiResponse } from '@repo/shared/types/api';
import type { Response } from 'express';

interface SendApiSuccessResponseOptions<T> {
  res: Response;
  status: 'success';
  statusCode: number;
  payload: T;
  error?: never;
  environment?: never;
}

interface SendApiFailureResponseOptions {
  res: Response;
  status: 'fail' | 'error';
  statusCode: number;
  error: ApiError;
  environment: 'development' | 'production';
  payload?: never;
}

type SendApiResponseOptions<T> =
  | SendApiSuccessResponseOptions<T>
  | SendApiFailureResponseOptions;

/**
 * Sends a standardized API response according to the ApiResponse contract.
 *
 * @param res Express response object
 * @param body The ApiResponse body (success or error)
 * @param statusCode Optional HTTP status code (defaults to 200 for success, 400 for fail, 500 for error)
 */
export function sendApiResponse<T>({
  res,
  status,
  statusCode,
  payload,
  error,
  environment = 'production',
}: SendApiResponseOptions<T>) {
  if (status === 'success') {
    const body: ApiResponse<T> = {
      status,
      data: payload,
    };

    res.status(statusCode).json(body);
  } else {
    // Ensure error is an instance of ApiError for serialization
    const theError =
      error instanceof ApiError
        ? error
        : new ApiError(
            (error as any)?.message || 'Unknown error',
            (error as any)?.statusCode || 500,
            (error as any)?.status || 'error',
            (error as any)?.isOperational ?? false
          );

    res.status(statusCode ?? theError.statusCode).json({
      status: theError.status,
      error: {
        message: theError.message,
        ...(environment === 'development'
          ? {
              isOperational: theError.isOperational,
              stack: theError.stack,
            }
          : {}),
      },
    });
  }
}
