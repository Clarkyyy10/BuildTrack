import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config.js';
import { getPool } from './db/connection.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();

// Same-origin in dev via Vite proxy; explicit CORS with credentials otherwise.
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// Initialize the Postgres pool on boot.
getPool();

app.listen(config.port, () => {
  console.log(`BuildTrack API listening on http://localhost:${config.port}`);
});
