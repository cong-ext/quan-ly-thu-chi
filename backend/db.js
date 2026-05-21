const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH
  ? path.join(process.env.DB_PATH, 'thuchi.db')
  : path.join(__dirname, 'thuchi.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('thu', 'chi')),
    amount REAL NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'tieu-dung',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migrate: thêm cột category nếu DB cũ chưa có
try {
  db.exec(`ALTER TABLE transactions ADD COLUMN category TEXT DEFAULT 'tieu-dung'`);
} catch {
  // Cột đã tồn tại, bỏ qua
}

module.exports = db;
