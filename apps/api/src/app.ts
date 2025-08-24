import { globalErrorHandler } from '@/controller/error-controller';
import { auth } from '@/lib/auth';
import { establishWebSocketAuthUpgrade } from '@/lib/websocket-auth';
import { retrieveUserSession } from '@/middleware/auth';
import apiRouter from '@/routes';
import { addWsRoutes } from '@/routes/ws-routes';
import { ApiError } from '@repo/shared/api/api-error';
import { toNodeHandler } from 'better-auth/node';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import expressWs from 'express-ws';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import morgan from 'morgan';
import xss from 'xss-clean';

export interface AppConfig {
  corsOrigin?: string;
}

export function createApp(config: AppConfig = {}): http.Server {
  const { corsOrigin } = config;
  const rawApp = express();
  const httpServer = http.createServer(rawApp);

  // 1. Enable WebSocket support
  const { app } = expressWs(rawApp, httpServer);

  // 2. Establish authentication on WebSocket upgrade
  establishWebSocketAuthUpgrade(httpServer);

  // 3. Security Middleware
  app.use(helmet()); // Sets various HTTP headers for security

  // 4. Development Logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // HTTP request logger
  }

  // 5. CORS Configuration
  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    })
  );

  // 6. Rate Limiting
  const limiter = rateLimit({
    max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Maximum 100 requests in production
    windowMs: 60 * 60 * 1000, // Per hour
    message: JSON.stringify({
      message: 'Too many requests from this IP, please try again in an hour!',
    }),
  });
  app.set('trust proxy', 1); // Trust first proxy
  app.use('/api', limiter);

  // 7. Security & Performance Middleware
  app.use(xss()); // Prevent XSS attacks
  app.use(compression()); // Compress response bodies
  app.use(hpp()); // Prevent HTTP Parameter Pollution

  // 8. Authentication Routes
  app.all('/api/auth/*', toNodeHandler(auth)); // Handle all auth routes

  // 9. Body Parsing (after auth routes via BetterAuth docs)
  app.use(express.json()); // Parse JSON request bodies

  // 10. Session Management
  app.use('/api', retrieveUserSession); // Add user session to all API routes

  // 11. API Routes
  app.use('/api', apiRouter); // Mount main API router

  // 12. WebSocket Routes
  addWsRoutes(app); // Setup WebSocket routes

  // 13. Error Handling
  app.all('*', (req, _res, next) => {
    next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
  app.use(globalErrorHandler); // Global error handler

  return httpServer;
}
