import type { ApiError } from '../api/api-error';

// ApiResponse type definitions for backend/frontend contract

export type ApiStatus = 'success' | 'fail' | 'error';

export interface SuccessResponse<T> {
  status: 'success';
  data: T;
}

export interface FailResponse {
  status: 'fail' | 'error';
  error: ApiError;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | FailResponse;
