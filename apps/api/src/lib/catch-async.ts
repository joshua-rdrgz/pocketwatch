import type { RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Parameters<RequestHandler>[0], // express.Request
  res: Parameters<RequestHandler>[1], // express.Response
  next: Parameters<RequestHandler>[2] // express.NextFunction
) => Promise<unknown>;

export const catchAsync = <T extends AsyncRequestHandler>(
  fn: T
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
