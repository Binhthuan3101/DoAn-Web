const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (pool) return pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Đã kết nối SQL Server thành công');
    return pool;
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    throw err;
  }
}

module.exports = { sql, getPool };