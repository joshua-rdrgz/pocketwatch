import express, { type Router } from 'express';
import { requireUserSession } from '@/middleware/auth.js';

const router: Router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  // For testing error handling
  if (req.query.error === 'true') {
    throw new Error(
      "Error thrown for testing purposes -- if you're in a testing environment or you called /api/health?error=true, ignore this error!"
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
});

// Protected demo route
router.get('/protected', requireUserSession, (req, res) => {
  res.status(200).json({
    user: req.user,
    session: req.session,
  });
});

export default router;
