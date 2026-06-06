const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'kiroo',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kiroo_assessment',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
