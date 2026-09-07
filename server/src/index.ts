import { app } from './app.js';
import { config } from './config.js';
import { getPool } from './db/connection.js';

// Initialize the Postgres pool on boot.
getPool();

app.listen(config.port, () => {
  console.log(`BuildTrack API listening on http://localhost:${config.port}`);
});
