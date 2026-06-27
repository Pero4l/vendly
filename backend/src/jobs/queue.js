const { Queue, Worker } = require('bullmq');
require('dotenv').config();

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null
};

// Fallback task handlers in case Redis is not available
const fallbackHandlers = {};

class MockQueue {
  constructor(name) {
    this.name = name;
  }
  async add(jobName, data, options) {
    console.log(`[MockQueue ${this.name}] Adding job: ${jobName}`, data);
    // Run asynchronously to simulate background queue execution
    setTimeout(async () => {
      const handler = fallbackHandlers[this.name];
      if (handler) {
        try {
          await handler({ data });
        } catch (err) {
          console.error(`[MockQueue ${this.name} Error] Job execution failed:`, err.message);
        }
      } else {
        console.warn(`[MockQueue ${this.name}] No worker registered for this queue.`);
      }
    }, 1000);
    return { id: `mock-${Math.random().toString(36).substr(2, 9)}` };
  }
}

class MockWorker {
  constructor(name, handler, options) {
    console.log(`[MockWorker] Registered fallback handler for queue: ${name}`);
    fallbackHandlers[name] = handler;
  }
  on(event, callback) {
    // No-op for mock worker events
  }
}

class WrappedWorker extends Worker {
  constructor(name, handler, options) {
    super(name, handler, options);
    fallbackHandlers[name] = handler;
    console.log(`[WrappedWorker] Registered fallback handler for queue: ${name}`);
  }
}


let txMonitorQueue;
let notificationQueue;
let walletQueue;
let useMock = false;

// If REDIS_HOST is set to localhost and redis is not running, we catch connection errors
// Or if user explicitly requests mock, or if we detect connection failures
if (process.env.USE_MOCK_QUEUE === 'true') {
  useMock = true;
}

if (useMock) {
  txMonitorQueue = new MockQueue('tx-monitor');
  notificationQueue = new MockQueue('notifications');
  walletQueue = new MockQueue('wallets');
} else {
  try {
    txMonitorQueue = new Queue('tx-monitor', { 
      connection,
      defaultJobOptions: { removeOnComplete: true }
    });
    notificationQueue = new Queue('notifications', { 
      connection,
      defaultJobOptions: { removeOnComplete: true }
    });
    walletQueue = new Queue('wallets', {
      connection,
      defaultJobOptions: { removeOnComplete: true }
    });

    // Check connection failures on error event
    txMonitorQueue.on('error', (err) => {
      if (!useMock) {
        console.warn('[Queue Warning] Redis connection issue for tx-monitor. Switching to In-Memory Mock Queue.');
        useMock = true;
        txMonitorQueue = new MockQueue('tx-monitor');
        notificationQueue = new MockQueue('notifications');
        walletQueue = new MockQueue('wallets');
      }
    });

    notificationQueue.on('error', (err) => {
      if (!useMock) {
        console.warn('[Queue Warning] Redis connection issue for notifications. Switching to In-Memory Mock Queue.');
        useMock = true;
        txMonitorQueue = new MockQueue('tx-monitor');
        notificationQueue = new MockQueue('notifications');
        walletQueue = new MockQueue('wallets');
      }
    });

    walletQueue.on('error', (err) => {
      if (!useMock) {
        console.warn('[Queue Warning] Redis connection issue for wallets. Switching to In-Memory Mock Queue.');
        useMock = true;
        txMonitorQueue = new MockQueue('tx-monitor');
        notificationQueue = new MockQueue('notifications');
        walletQueue = new MockQueue('wallets');
      }
    });
  } catch (err) {
    console.warn('[Queue Warning] Failed initializing BullMQ. Falling back to Mock Queue.', err.message);
    useMock = true;
    txMonitorQueue = new MockQueue('tx-monitor');
    notificationQueue = new MockQueue('notifications');
    walletQueue = new MockQueue('wallets');
  }
}

/**
 * Adds a transaction monitoring job.
 * @param {string} txHash 
 * @param {string} transactionId 
 */
async function addTxMonitorJob(txHash, transactionId) {
  await txMonitorQueue.add('verify-tx', { txHash, transactionId }, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
}

/**
 * Adds an async notification dispatch job.
 */
async function addNotificationJob(userId, title, message) {
  await notificationQueue.add('send-notification', { userId, title, message });
}

/**
 * Adds a background wallet creation job.
 * @param {string} userId
 * @param {string} username
 */
async function addWalletCreationJob(userId, username) {
  await walletQueue.add('create-wallet', { userId, username });
}

module.exports = {
  txMonitorQueue,
  notificationQueue,
  walletQueue,
  addTxMonitorJob,
  addNotificationJob,
  addWalletCreationJob,
  connection,
  Worker: useMock ? MockWorker : WrappedWorker,
  getWorkerClass: () => (useMock ? MockWorker : WrappedWorker)
};

