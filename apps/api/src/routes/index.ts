import { healthCheck, protectedRoute } from '@/controller/base-controller';
import { requireUserSession } from '@/middleware/auth';
import express, { type Router } from 'express';

const router: Router = express.Router();

// Health check endpoint
router.get('/health', healthCheck);

// Protected demo route
router.get('/protected', requireUserSession, protectedRoute);

export default router;
