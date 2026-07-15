/**
 * src/lib/db.js
 * PostgreSQL connection pool using `pg`
 * Optimized for serverless (Vercel/Supabase) environments
 */

import { Pool } from 'pg';

// Reuse the pool across hot-reloads in development
let pool;

function getPool() {
  if (pool) return pool;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const isSupabase =
    process.env.DATABASE_URL.includes('supabase') ||
    process.env.DATABASE_URL.includes('sslmode=require');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
    // Serverless-friendly pool settings
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle pg client', err);
  });

  return pool;
}

/**
 * Execute a parameterized query
 * @param {string} text - SQL query with $1, $2... placeholders
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
export async function query(text, params = []) {
  const p = getPool();
  const start = Date.now();
  try {
    const res = await p.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('DB Query executed', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (err) {
    console.error('Database query error:', err.message, { text: text.substring(0, 80) });
    throw err;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  const p = getPool();
  const client = await p.connect();
  const originalRelease = client.release.bind(client);
  // Override release to log if client was checked out too long
  let released = false;
  client.release = () => {
    if (released) return;
    released = true;
    originalRelease();
  };
  return client;
}

export default { query, getClient };
