import express from "express";
import { initializeDatabase } from "./db";
const { v4: uuidv4 } = require("uuid");
import { sendMessage } from "./bot";

const apiRouter = express.Router();
let db: any;

/**
 * A wrapper function for db.run that returns a promise.
 * @param {string} sql The SQL query to run.
 * @param {Array} params Parameters for the SQL query.
 * @returns {Promise} A promise that resolves with { lastID, changes } upon successful execution.
 */
function dbRunAsync(sql: string, params: any[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: any, err: Error | null) {
      if (err) {
        reject(err); // Reject the promise on error
      } else {
        resolve({ lastID: this.lastID, changes: this.changes }); // Resolve with relevant info
      }
    });
  });
}

apiRouter.post("/save-validator", async (req, res) => {
  // This will get called from the installer script
  // Create new row for IP:Port and generate a token for the validator
  // Return this token in response
  try {
    const data = req.body;
    const username = `${data.ip}:${data.port}`;

    // Verify that the IP:Port is of valid format
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/.test(username)) {
      res.status(400).send("Invalid IP:Port format");
      return;
    }

    const uniqueToken = uuidv4();

    await dbRunAsync("INSERT INTO users (username, token) VALUES (?, ?)", [
      username,
      uniqueToken,
    ]);

    res.send({ token: uniqueToken });
  } catch (err: any) {
    if (err.code === "SQLITE_CONSTRAINT") {
      res.status(409).send("This IP:Port is already registered.");
    } else {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  }

  // EDGE CASES
  // IP:Port already in database -> Return as is
  // IP:Port should be of valid format
});

apiRouter.post("/send-message", async (req, res) => {
  // Send message to the corresponding ChatID
  // Get ChatID from given Token
  const chatID = db.get(
    "SELECT chatID FROM users WHERE token = ?",
    [req.body.token],
    async (err: any, row: any) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal server error");
        return;
      } else {
        await sendMessage(row.chatID, req.body.message);
        res.status(200).send("Message sent");
        return;
      }
    }
  );
});

export async function stopNotifications(chatID: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE users SET chatID = NULL WHERE chatID = ?",
      [chatID],
      function (err: Error | null) {
        if (err) {
          console.log(err);
          reject(err); // Reject the promise if there was an error
        } else {
          resolve(); // Resolve the promise when the operation is successful
        }
      }
    );
  });
}

export async function saveUser(
  ipPort: string,
  chatId: string
): Promise<boolean> {
  // This will get called by the telegram bot when someone texts it
  // Save ChatID to the corresponding row containing IP:Port and Token
  // You can make the bot ask for the dashboard password,
  // and hit the login endpoint on the IP:Port
  // and only the ChatID to the corresponding row if it was successful

  // Add ChatID to the row containing the given ipPort
  return new Promise((resolve) => {
    // Using run method to execute the UPDATE statement
    db.run(
      "UPDATE users SET chatID = ? WHERE username = ?",
      [chatId, ipPort],
      function (this: any, err: Error | null) {
        if (err) {
          console.log(err);
          resolve(false); // If there was an error, resolve the promise with false
        } else if (this.changes > 0) {
          resolve(true); // If the row was updated, resolve the promise with true
        } else {
          resolve(false); // If no rows were updated (i.e., no row for the given ipPort), resolve with false
        }
      }
    );
  });
}

export async function getApiRouter() {
  db = await initializeDatabase();
  if (!db) {
    throw new Error("Could not initialize database");
  }

  return apiRouter;
}
