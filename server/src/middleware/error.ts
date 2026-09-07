import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { config } from '../config.js';

/** Central error handler → human, actionable JSON (Req 19.5). */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Always log server-side so hosted platforms (Render) capture the cause.
  console.error(err);

  return res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Something went wrong on our end. Please try again.',
    },
  });
}

/** 404 for unmatched API routes. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'not_found', message: 'That resource could not be found.' },
  });
}
