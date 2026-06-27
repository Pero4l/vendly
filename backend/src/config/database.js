require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || '';
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

const sslOptions = isLocal
  ? {}
  : { ssl: { require: true, rejectUnauthorized: false } };

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: sslOptions,
    logging: false,
    pool: { max: 5, min: 0, acquire: 60000, idle: 10000 }
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: sslOptions,
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    pool: { max: 10, min: 0, acquire: 60000, idle: 10000 }
  }
};
