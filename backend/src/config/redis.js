const Redis = require('ioredis');

const isRemote = process.env.REDIS_HOST && process.env.REDIS_HOST !== '127.0.0.1' && process.env.REDIS_HOST !== 'localhost';

const client = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  ...(isRemote ? { tls: {} } : {}),
  maxRetriesPerRequest: 3,
  lazyConnect: false
});

client.on('error', (err) => {
  console.warn('[Redis] Connection error:', err.message);
});

module.exports = client;
