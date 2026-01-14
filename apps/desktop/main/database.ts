import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
let db: Database.Database;

export function getConfig(): { savePath?: string } {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to read config:', error);
  }
  return {};
}

export function setConfig(config: { savePath?: string }): void {
  try {
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write config:', error);
  }
}

export function getDatabasePath(): string {
  const config = getConfig();
  if (config.savePath && config.savePath.trim()) {
    return path.join(config.savePath.trim(), 'memos.db');
  }
  return path.join(userDataPath, 'memos.db');
}

export function initDatabase(): void {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory:', dbDir);
  }
  
  db = new Database(dbPath);
  console.log('Database initialized at:', dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      canvas_data TEXT,
      mode TEXT DEFAULT 'text',
      folder_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      window_state TEXT,
      FOREIGN KEY (folder_id) REFERENCES folders(id)
    );
    
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES folders(id)
    );
    
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS memo_tags (
      memo_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (memo_id, tag_id),
      FOREIGN KEY (memo_id) REFERENCES memos(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    initDatabase();
  }
  return db;
}
