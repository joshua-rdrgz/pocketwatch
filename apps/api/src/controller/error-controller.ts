/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Response, type ErrorRequestHandler } from 'express';

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  switch (process.env.NODE_ENV) {
    case 'development':
      sendErrorDev(err, res);
      break;
    case 'production':
      sendErrorProd(err, res);
      break;
  }
};

function sendErrorDev(err: any, res: Response) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
}

function sendErrorProd(err: any, res: Response) {
  if (err.isOperational) {
    // Operational (trusted) error, send message to client.
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other (unknown) error, don't leak details
    console.log('ERROR CAUGHT 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! :(',
    });
  }
}
