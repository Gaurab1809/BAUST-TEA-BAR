import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const initDb = async () => {
  const db = await open({
    filename: './backend/database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      designation TEXT,
      department TEXT,
      phone TEXT,
      role TEXT DEFAULT 'user',
      blocked TEXT DEFAULT 'none',
      passwordHash TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expiresAt DATETIME NOT NULL,
      used INTEGER DEFAULT 0
    );
  `);

  // Insert Mock Users if table is empty
  const count = await db.get(`SELECT COUNT(*) as count FROM users`);
  if (count.count === 0) {
     // Admin: 123456 (hash using bcrypt)
     // To avoid keeping bcrypt as a dependency here, we insert plain bcrypt hashed passwords
     // $2a$10$wN9Q9yR....
     // Let's rely on server.js to insert the initial users with bcrypt!
  }

  return db;
};
