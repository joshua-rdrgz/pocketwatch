import { globalErrorHandler } from '@/controller/error-controller.js';
import { AppError } from '@/lib/app-error.js';
import { auth } from '@/lib/auth.js';
import { retrieveUserSession } from '@/middleware/auth.js';
import apiRouter from '@/routes/index.js';
import { toNodeHandler } from 'better-auth/node';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import xss from 'xss-clean';

export interface AppConfig {
  corsOrigin?: string;
}

export function createApp(config: AppConfig = {}): express.Express {
  const { corsOrigin } = config;
  const app = express();

  // 1. Security Middleware
  app.use(helmet()); // Sets various HTTP headers for security

  // 2. Development Logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // HTTP request logger
  }

  // 3. CORS Configuration
  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    })
  );

  // 4. Rate Limiting
  const limiter = rateLimit({
    max: 100, // Maximum 100 requests
    windowMs: 60 * 60 * 1000, // Per hour
    message: JSON.stringify({
      message: 'Too many requests from this IP, please try again in an hour!',
    }),
  });
  app.set('trust proxy', 1); // Trust first proxy
  app.use('/api', limiter);

  // 5. Security & Performance Middleware
  app.use(xss()); // Prevent XSS attacks
  app.use(compression()); // Compress response bodies
  app.use(hpp()); // Prevent HTTP Parameter Pollution

  // 6. Authentication Routes
  app.all('/api/auth/*', toNodeHandler(auth)); // Handle all auth routes

  // 7. Body Parsing (after auth routes via BetterAuth docs)
  app.use(express.json()); // Parse JSON request bodies

  // 8. Session Management
  app.use('/api', retrieveUserSession); // Add user session to all API routes

  // 9. API Routes
  app.use('/api', apiRouter); // Mount main API router

  // 10. Error Handling
  app.all('*', (req, _res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
  app.use(globalErrorHandler); // Global error handler

  return app;
}
