/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { auth } from '@/lib/auth.js';

// Extend Express Request interface to include user and session
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

export const retrieveUserSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get session from betterauth
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session?.user) {
      req.user = session.user;
    }

    if (session?.session) {
      req.session = session.session;
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
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  // Check if session is expired
  if (req.session.expiresAt && new Date(req.session.expiresAt) < new Date()) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  next();
};
