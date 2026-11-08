const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let pool = null;

function sanitizeParams(params) {
  if (!Array.isArray(params)) return [];
  return params.map(val => (val === undefined ? null : val));
}

function init() {
  if (pool) return pool;

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'billpro';

  pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    multipleStatements: true,
    dateStrings: true,
    decimalNumbers: true
  });

  return pool;
}

// Auto-initialize connection pool
init();

async function testConnection() {
  try {
    if (!pool) init();
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log(`[MySQL] Successfully connected to database: ${process.env.DB_NAME || 'billpro'} at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    return true;
  } catch (err) {
    console.error(`[MySQL Error] Failed to connect to MySQL database:`, err.message);
    throw err;
  }
}

async function query(sql, params = []) {
  if (!pool) init();
  const cleanParams = sanitizeParams(params);
  const [rows] = await pool.execute(sql, cleanParams);
  return rows;
}

async function get(sql, params = []) {
  if (!pool) init();
  const cleanParams = sanitizeParams(params);
  const [rows] = await pool.execute(sql, cleanParams);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function run(sql, params = []) {
  if (!pool) init();
  const cleanParams = sanitizeParams(params);
  const [result] = await pool.execute(sql, cleanParams);
  return {
    lastInsertRowid: result.insertId,
    changes: result.affectedRows,
    affectedRows: result.affectedRows
  };
}

async function exec(sql) {
  if (!pool) init();
  const [result] = await pool.query(sql);
  return result;
}

module.exports = {
  init,
  testConnection,
  query,
  get,
  run,
  exec,
  getPool: () => pool,
  isMySQL: () => true
};
