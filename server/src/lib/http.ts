import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route/middleware so a thrown/rejected error is forwarded to
 * Express's error handler (Express 4 doesn't catch async rejections itself).
 */
export function ah(
  fn: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
