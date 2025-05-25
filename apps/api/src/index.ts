import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from '@/lib/auth.js';

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Express App Definition
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    // origin: 'http://your-frontend-domain.com', // Replace with your frontend's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

// Authentication
app.all('/api/auth/*', toNodeHandler(auth));

// Middleware (must not interact with Better-Auth)
app.use(express.json());

// Basic route
app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the Pocketwatch API' });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/api/me', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

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

// Configure App To Listen For Requests
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle Unhandled Rejections
process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
