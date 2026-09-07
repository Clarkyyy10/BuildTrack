/**
 * Application error with an HTTP status, a stable machine code, and a
 * human-readable message (surfaced to the client per Req 19.5).
 */
export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg: string, code = 'bad_request') =>
  new AppError(400, code, msg);
export const unauthorized = (msg = 'You need to sign in to continue.', code = 'unauthorized') =>
  new AppError(401, code, msg);
export const forbidden = (msg = "You don't have permission to do that.", code = 'forbidden') =>
  new AppError(403, code, msg);
export const notFound = (msg = 'That item could not be found.', code = 'not_found') =>
  new AppError(404, code, msg);
export const conflict = (msg: string, code = 'conflict') =>
  new AppError(409, code, msg);
