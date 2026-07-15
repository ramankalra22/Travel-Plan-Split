#!/usr/bin/env node
/**
 * scripts/init-db.js
 * Reads DATABASE_URL from .env.local and executes migrations/init.sql
 * Usage: npm run db:init
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
  console.log('✅ Loaded environment from .env.local');
} else {
  console.warn('⚠️  .env.local not found. Using system environment variables.');
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Add it to .env.local or your environment.');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '..', 'migrations', 'init.sql');
if (!fs.existsSync(sqlPath)) {
  console.error(`❌ Migration file not found: ${sqlPath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// For Supabase, we need SSL
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') || DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 1, // Use single connection for migration
});

async function runMigration() {
  let client;
  try {
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected successfully!\n');

    console.log('📦 Running migration: migrations/init.sql');
    console.log('─'.repeat(50));

    await client.query(sqlContent);

    console.log('─'.repeat(50));
    console.log('\n✅ Database initialized successfully!');
    console.log('📊 Tables created: users, trips, trip_members, destinations, activities, expenses, expense_participants');
    console.log('🚀 Your Travel Planner database is ready!\n');

  } catch (err) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', err.message);
    if (err.hint) console.error('Hint:', err.hint);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigration();
