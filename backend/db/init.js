import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../database.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Promisify database operations
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export async function initializeDatabase() {
  try {
    // Enable foreign keys
    await dbRun('PRAGMA foreign_keys = ON');

    // Create users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin', 'data_entry', 'viewer')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create members table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        rank TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        amount_invested REAL NOT NULL DEFAULT 0,
        number_of_shares REAL NOT NULL DEFAULT 0,
        date_joined DATE NOT NULL,
        last_payment_date DATE,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create activity log table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create default admin user if not exists
    const adminExists = await dbGet('SELECT id FROM users WHERE email = ?', ['admin@ims.com']);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password', 10);
      await dbRun(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@ims.com', hashedPassword, 'admin']
      );
      
      // Create demo data_entry and viewer users
      const entryPassword = await bcrypt.hash('password', 10);
      const viewerPassword = await bcrypt.hash('password', 10);
      
      await dbRun(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Data Entry User', 'entry@ims.com', entryPassword, 'data_entry']
      );
      
      await dbRun(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Viewer User', 'viewer@ims.com', viewerPassword, 'viewer']
      );
      
      console.log('Default users created');
    }

    // Initialize default settings
    const sharePrice = await dbGet('SELECT value FROM settings WHERE key = ?', ['share_price']);
    if (!sharePrice) {
      await dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', ['share_price', '100']);
      await dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', ['profit_percentage', '0']);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}