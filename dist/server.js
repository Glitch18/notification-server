"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_1 = require("./api");
const bot_1 = require("./bot");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
bot_1.bot.launch(); // Start the bot
// Enable graceful stop
process.once("SIGINT", () => bot_1.bot.stop("SIGINT"));
process.once("SIGTERM", () => bot_1.bot.stop("SIGTERM"));
(0, api_1.getApiRouter)().then((apiRouter) => {
    app.use("/api", apiRouter);
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});
