require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { sequelize } = require('./models');
const { initSocket } = require('./sockets/chatSocket');
const { startWorkers } = require('./jobs/processors');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Setup socket listeners
initSocket(io);

// Start HTTP server and establish connections
async function start() {
  // ── Database ──────────────────────────────────────────────────────────────
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('user:password@localhost')) {
    logger.error('────────────────────────────────────────────────────────────');
    logger.error('  DATABASE_URL is not set in .env');
    logger.error('  Set it to your PostgreSQL connection string, e.g.:');
    logger.error('  DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>');
    logger.error('  Hosted options: Supabase · Neon · Railway · Render');
    logger.error('────────────────────────────────────────────────────────────');
    process.exit(1);
  }

  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('Database connection established.');
  } catch (error) {
    const root = error.original || error.parent || error; 
    const msg = root.message || error.message || String(error);
    logger.error('────────────────────────────────────────────────────────────');
    logger.error('  Could not connect to the database.');
    logger.error(`  ${msg}`);
    logger.error('────────────────────────────────────────────────────────────');
    process.exit(1);
  }

  // ── Schema sync ───────────────────────────────────────────────────────────
  // force=true  → drops and recreates all tables (dev reset only)
  // alter=true  → mutates existing columns (uses many connections — avoid on small plans)
  // default     → creates missing tables only, leaves existing ones untouched
  const syncForce = process.env.DB_SYNC_FORCE === 'true';
  const syncAlter = process.env.DB_SYNC_ALTER === 'true';
  try {
    await sequelize.sync({ force: syncForce, alter: syncAlter });
    logger.info(`Database synced (force=${syncForce}, alter=${syncAlter})`);
  } catch (syncErr) {
    // Non-fatal — tables may already exist with correct schema
    logger.warn(`Database sync warning: ${syncErr.message}`);
  }

  // ── Background workers ────────────────────────────────────────────────────
  try {
    startWorkers();
    logger.info('Background workers started.');
  } catch (err) {
    logger.warn('Background workers failed to start (jobs will use mock queue):', err.message);
  }

  // ── HTTP server ───────────────────────────────────────────────────────────
  server.listen(PORT, () => {
    logger.info(`Vendly API running on http://localhost:${PORT}`);
  });
}

start();
