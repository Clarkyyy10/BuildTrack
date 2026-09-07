import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { query } from './db/connection.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.set('trust proxy', 1); // behind Render's proxy (correct secure cookies + req.ip)

// Allow the configured client origin(s). CLIENT_ORIGIN may be comma-separated.
const allowedOrigins = config.clientOrigin.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' })); // room for avatar data URLs
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Temporary DB diagnostics: verifies the Supabase connection without leaking secrets.
app.get('/api/health/db', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, db: 'connected', host: config.db.host, user: config.db.user });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    res.status(500).json({
      ok: false,
      code: err?.code ?? null,
      message: String(err?.message ?? e).slice(0, 200),
      host: config.db.host,
      user: config.db.user,
      hasPassword: Boolean(config.db.password),
    });
  }
});

app.use('/api', apiRouter);
app.use('/api', notFoundHandler); // JSON 404 for unmatched API routes

// In production, serve the built React app (single-service deploy) and let the
// SPA handle client-side routing.
if (config.isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
