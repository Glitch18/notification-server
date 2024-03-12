"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiRouter = exports.saveUser = exports.stopNotifications = void 0;
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const { v4: uuidv4 } = require("uuid");
const bot_1 = require("./bot");
const apiRouter = express_1.default.Router();
let db;
/**
 * A wrapper function for db.run that returns a promise.
 * @param {string} sql The SQL query to run.
 * @param {Array} params Parameters for the SQL query.
 * @returns {Promise} A promise that resolves with { lastID, changes } upon successful execution.
 */
function dbRunAsync(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err); // Reject the promise on error
            }
            else {
                resolve({ lastID: this.lastID, changes: this.changes }); // Resolve with relevant info
            }
        });
    });
}
apiRouter.post("/save-validator", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // This will get called from the installer script
    // Create new row for IP:Port and generate a token for the validator
    // Return this token in response
    try {
        const data = req.body;
        const username = `${data.ip}:${data.port}`;
        const uniqueToken = uuidv4();
        // Assuming you have an asynchronous version of `db.run`, e.g., using `util.promisify` or a wrapper library
        yield dbRunAsync("INSERT INTO users (username, token) VALUES (?, ?)", [
            username,
            uniqueToken,
        ]);
        res.send({ token: uniqueToken });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}));
apiRouter.post("/send-message", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Send message to the corresponding ChatID
    // Get ChatID from given Token
    const chatID = db.get("SELECT chatID FROM users WHERE token = ?", [req.body.token], (err, row) => {
        if (err) {
            console.log(err);
            return null;
        }
        else {
            return row.chatID;
        }
    });
    if (!chatID) {
        console.log(`ChatID not found for ${req.body.token}`);
        return;
    }
    yield (0, bot_1.sendMessage)(chatID, req.body.message);
}));
function stopNotifications(chatID) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            db.run("UPDATE users SET chatID = NULL WHERE chatID = ?", [chatID], function (err) {
                if (err) {
                    console.log(err);
                    reject(err); // Reject the promise if there was an error
                }
                else {
                    resolve(); // Resolve the promise when the operation is successful
                }
            });
        });
    });
}
exports.stopNotifications = stopNotifications;
function saveUser(ipPort, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        // This will get called by the telegram bot when someone texts it
        // Save ChatID to the corresponding row containing IP:Port and Token
        // You can make the bot ask for the dashboard password,
        // and hit the login endpoint on the IP:Port
        // and only the ChatID to the corresponding row if it was successful
        // Add ChatID to the row containing the given ipPort
        return new Promise((resolve) => {
            // Using run method to execute the UPDATE statement
            db.run("UPDATE users SET chatID = ? WHERE username = ?", [chatId, ipPort], function (err) {
                if (err) {
                    console.log(err);
                    resolve(false); // If there was an error, resolve the promise with false
                }
                else if (this.changes > 0) {
                    resolve(true); // If the row was updated, resolve the promise with true
                }
                else {
                    resolve(false); // If no rows were updated (i.e., no row for the given ipPort), resolve with false
                }
            });
        });
    });
}
exports.saveUser = saveUser;
function getApiRouter() {
    return __awaiter(this, void 0, void 0, function* () {
        db = yield (0, db_1.initializeDatabase)();
        if (!db) {
            throw new Error("Could not initialize database");
        }
        return apiRouter;
    });
}
exports.getApiRouter = getApiRouter;
