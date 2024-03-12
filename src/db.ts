import sqlite3 from "sqlite3";
import path from "path";

sqlite3.verbose();

const dbPath = path.join(__dirname, "../db.sqlite");

async function initializeDatabase() {
  try {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        return console.log(err.message);
      }
      console.log("Connected to database!");
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
