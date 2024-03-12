import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

sqlite3.verbose();

const dbPath = path.join(__dirname, "../db.sqlite");

async function initializeDatabase() {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        chatID TEXT UNIQUE,
        CHECK (username IS NOT NULL AND token IS NOT NULL)
      )`);

    console.log("Database is ready.");
    return db;
  } catch (error) {
    console.error("Could not initialize database:", error);
  }
}

export { initializeDatabase };
