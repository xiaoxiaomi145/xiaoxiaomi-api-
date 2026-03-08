import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    points REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model_id TEXT UNIQUE NOT NULL,
    upstream_url TEXT NOT NULL,
    upstream_key TEXT NOT NULL,
    billing_mode TEXT DEFAULT 'per_token', -- 'per_request' or 'per_token'
    prompt_price REAL DEFAULT 0,
    completion_price REAL DEFAULT 0,
    request_price REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    rpm_limit INTEGER DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_models (
    user_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    PRIMARY KEY (user_id, model_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS request_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    points_deducted REAL DEFAULT 0,
    request_content TEXT,
    response_content TEXT,
    is_compressed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL
  );
`);

// Add new columns if they don't exist
try { db.exec("ALTER TABLE users ADD COLUMN daily_token_limit INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN daily_request_limit INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE models ADD COLUMN alias TEXT DEFAULT '';"); } catch (e) {}

// Insert default settings if not exist
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
insertSetting.run('log_retention_days', '30');
insertSetting.run('default_user_points', '1000');
insertSetting.run('daily_reset_points', '0');
insertSetting.run('last_daily_reset', '1970-01-01');
insertSetting.run('system_name', 'xiaoxiaomi的小破站');
insertSetting.run('api_key_prefix', 'sk-');
insertSetting.run('smtp_host', process.env.SMTP_HOST || '');
insertSetting.run('smtp_port', process.env.SMTP_PORT || '587');
insertSetting.run('smtp_user', process.env.SMTP_USER || '');
insertSetting.run('smtp_pass', process.env.SMTP_PASS || '');
insertSetting.run('smtp_from', process.env.SMTP_FROM || '');

export default db;
