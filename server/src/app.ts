import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export const app = express();

app.set('trust proxy', 1); // behind Vercel/Render proxies (correct secure cookies + req.ip)

// Allow the configured client origin(s). CLIENT_ORIGIN may be comma-separated.
const allowedOrigins = config.clientOrigin.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      // Same-origin/proxied requests have no Origin header — allow them.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' })); // room for avatar data URLs
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
