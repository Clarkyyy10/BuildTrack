import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { AppError } from '../lib/errors.js';

/** Validates req.body against a zod schema, replacing it with parsed data. */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body) as z.infer<T>;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const field = first?.path.join('.') || 'input';
        next(new AppError(400, 'validation_error', `${field}: ${first?.message ?? 'Invalid input.'}`));
      } else {
        next(err);
      }
    }
  };
}
