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
  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sync database models (disable force in production to avoid data loss)
    const syncForce = process.env.DB_SYNC_FORCE === 'true';
    await sequelize.sync({ force: syncForce });
    logger.info(`Database synced (Force: ${syncForce})`);

    // Start BullMQ Background workers
    logger.info('Starting background workers...');
    try {
      startWorkers();
      logger.info('Background workers started successfully.');
    } catch (redisErr) {
      logger.warn('Failed connecting to Redis. Background jobs might not run:', redisErr.message);
    }

    server.listen(PORT, () => {
      logger.info(`Vendly Backend server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Vendly server:', error);
    process.exit(1);
  }
}

start();
