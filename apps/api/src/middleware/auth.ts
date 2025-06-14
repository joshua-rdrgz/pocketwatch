/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth';
import { sendApiResponse } from '@/lib/send-api-response';
import { ApiError } from '@repo/shared/api/api-error';
import { NextFunction, Request, Response } from 'express';

export const retrieveUserSession = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get session from betterauth
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session?.user) {
      req.user = {
        ...session.user,
        image: session.user.image ?? null,
      };
    }

    if (session?.session) {
      req.session = {
        ...session.session,
        ipAddress: session.session.ipAddress ?? null,
        userAgent: session.session.userAgent ?? undefined,
      };
    }
  } catch (error) {
    // Don't block request if session retrieval fails
    console.log('Session retrieval failed:', error);
  }

  next();
};

export const requireUserSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.session) {
    return sendApiResponse({
      res,
      status: 'fail',
      statusCode: 401,
      error: new ApiError(
        'You are unauthorized and cannot access this resource.',
        401
      ),
    });
  }

  // Check if session is expired
  if (req.session.expiresAt && new Date(req.session.expiresAt) < new Date()) {
    return sendApiResponse({
      res,
      status: 'fail',
      statusCode: 401,
      error: new ApiError(
        'You are unauthorized and cannot access this resource.',
        401
      ),
    });
  }

  next();
};
