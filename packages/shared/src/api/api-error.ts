export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public status: string = statusCode.toString().startsWith('4')
      ? 'fail'
      : 'error',
    public isOperational: boolean = true
  ) {
    super(message);

    // Removes constructor from stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
