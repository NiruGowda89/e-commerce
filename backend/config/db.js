const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

const dbUrl = process.env.SPRING_DATASOURCE_URL || process.env.DATABASE_URL;

if (dbUrl) {
  let cleanedUrl = dbUrl;
  if (dbUrl.startsWith('jdbc:')) {
    cleanedUrl = dbUrl.substring(5); // remove 'jdbc:'
  }
  if (!cleanedUrl.includes('://')) {
    cleanedUrl = 'mysql://' + cleanedUrl;
  }
  
  // Strip out jdbc query parameters like ssl-mode or useSSL
  const queryIndex = cleanedUrl.indexOf('?');
  if (queryIndex !== -1) {
    cleanedUrl = cleanedUrl.substring(0, queryIndex);
  }

  sequelize = new Sequelize(cleanedUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: dbUrl.includes('aivencloud') || dbUrl.includes('ssl-mode') ? {
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ecommerce_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || 'gowda',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
    }
  );
}

module.exports = sequelize;
