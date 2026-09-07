import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth middleware. */
      auth?: {
        userId: string;
        sessionId: string;
      };
      /** Populated by requirePermission / context resolution. */
      projectId?: string;
      componentId?: string;
      memberRole?: string;
    }
  }
}

export {};
