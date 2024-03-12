import express, { Request, Response } from "express";
import { getApiRouter } from "./api";
import { bot } from "./bot";

const app = express();
const port = 3000;
app.use(express.json());

bot.launch(); // Start the bot

// Enable graceful stop
process.once("SIGINT", () => {
  bot.stop("SIGINT");
  process.kill(process.pid, "SIGINT");
});
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  process.kill(process.pid, "SIGTERM");
});

getApiRouter().then((apiRouter) => {
  app.use("/api", apiRouter);
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
