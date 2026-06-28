const { Sequelize } = require('sequelize');
require('dotenv').config();

// Detect if we're connecting to a cloud/SSL-required host
const isCloudDB = (host) => {
  if (!host) return false;
  return host.includes('aivencloud') ||
         host.includes('render.com') ||
         host.includes('planetscale') ||
         host.includes('railway.app') ||
         host.includes('elephantsql') ||
         host.includes('cleardb');
};

let sequelize;

const dbUrl = process.env.DATABASE_URL;        // Render/Heroku-style full URL (optional)
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbName = process.env.DB_NAME || 'ecommerce_db';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || '';
const sslRequired = isCloudDB(dbHost) || process.env.DB_SSL === 'true';

if (dbUrl) {
  // Full connection URL (e.g. mysql://user:pass@host:port/db)
  let cleanUrl = dbUrl.startsWith('jdbc:') ? dbUrl.slice(5) : dbUrl;
  const qIdx = cleanUrl.indexOf('?');
  if (qIdx !== -1) cleanUrl = cleanUrl.slice(0, qIdx);

  sequelize = new Sequelize(cleanUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: isCloudDB(cleanUrl) ? { rejectUnauthorized: false } : false
    }
  });
} else {
  // Individual env vars (local dev or Render with explicit DB_* vars)
  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    dialectOptions: sslRequired
      ? { ssl: { rejectUnauthorized: false } }
      : {}
  });
}

module.exports = sequelize;
