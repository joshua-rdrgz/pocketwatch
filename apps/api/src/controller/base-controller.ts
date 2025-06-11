import { AppError } from '@/lib/app-error';
import { type RequestHandler } from 'express';

export const healthCheck: RequestHandler = (req, res) => {
  // For testing error handling
  if (req.query.error === 'true') {
    throw new AppError(
      "Error thrown for testing purposes -- if you're in a testing environment or you called /api/health?error=true, ignore this error!",
      500
    );
  }

  // Check if user is authenticated
  if (req.user && req.session) {
    res.status(200).json({
      status: 'OK',
      message: 'Welcome to the Pocketwatch API!',
      authenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      session: {
        id: req.session.id,
        token: req.session.token,
        expiresAt: req.session.expiresAt,
      },
    });
  } else {
    res.status(200).json({
      status: 'OK',
      message: 'Welcome to the Pocketwatch API!',
      authenticated: false,
    });
  }
};

export const protectedRoute: RequestHandler = (req, res) => {
  res.status(200).json({
    message: 'You are authenticated!',
    user: req.user,
    session: req.session,
  });
};
