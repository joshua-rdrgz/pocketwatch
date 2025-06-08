import { createApp } from './app.js';

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Create Express App
const app = createApp({
  // corsOrigin: 'http://your-frontend-domain.com', // Replace with your frontend's origin
});

const PORT = process.env.PORT || 3001;

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
