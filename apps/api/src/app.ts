import { auth } from '@/lib/auth.js';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import apiRouter from '@/routes/index.js';
import { retrieveUserSession } from '@/middleware/auth.js';

export interface AppConfig {
  corsOrigin?: string;
}

export function createApp(config: AppConfig = {}): express.Express {
  const { corsOrigin } = config;

  const app = express();

  // CORS Middleware
  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    })
  );

  // Authentication (BetterAuth routes)
  app.all('/api/auth/*', toNodeHandler(auth));

  // JSON Middleware (must not interact with Better-Auth)
  app.use(express.json());

  // Apply retrieveUserSession middleware to all /api routes
  app.use('/api', retrieveUserSession);

  // Mount application API Routes
  app.use('/api', apiRouter);

  // 404 Handling
  app.use((_req, res, _next) => {
    res.status(404).send({
      status: 404,
      message: 'Route Not Found',
    });
  });

  // 500 Error Handler
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).send({
      status: 500,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? {} : err.stack,
    });
  };
  app.use(errorHandler);

  return app;
}
