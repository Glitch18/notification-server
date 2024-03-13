import { Telegraf } from "telegraf";
import { stopNotifications, saveUser } from "./api";
const { message } = require("telegraf/filters");

if (!process.env.BOT_TOKEN) {
  throw new Error("Env var BOT_TOKEN must be provided!");
}
const bot = new Telegraf(process.env.BOT_TOKEN);

async function sendMessage(chatID: string, message: string) {
  return bot.telegram.sendMessage(chatID, message);
}

// Bot commands
bot.start((ctx) =>
  ctx.reply("Welcome! Please use /subscribe to start receiving notifications.")
);
bot.help((ctx) =>
  ctx.reply(
    `To start receiving notifications for your Validator, please use /subscribe\nTo stop the notifications, please use /unsubscribe`
  )
);
// A Map to hold state about who is currently subscribing
const subscribingUsers = new Map();

bot.command("subscribe", (ctx) => {
  const chatId = ctx.chat.id;
  // Prompt the user for input
  ctx.reply(`Please enter your IP and Port (e.g. 192.168.0.1:9001):`);
  // Mark the user as "subscribing"
  subscribingUsers.set(chatId, true);
});

bot.command("unsubscribe", (ctx) => {
  stopNotifications(ctx.chat.id.toString())
    .then(() => ctx.reply("You have successfully unsubscribed."))
    .catch((err) => {
      console.error("Error stopping notifications:", err);
    });
});
bot.on(message("text"), async (ctx) => {
  const chat = await ctx.getChat();
  const chatId = chat.id;
  // Check if the user is in the process of subscribing
  if (subscribingUsers.get(chatId)) {
    const userInput = ctx.text;
    if (!userInput) {
      ctx.reply(
        "Invalid response. Please enter Ip:Port in the format 192.168.0.1:9001"
      );
      return;
    }
    // Check if the user input is a valid IP:Port
    const ipPortRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}/;
    if (!ipPortRegex.test(userInput)) {
      ctx.reply(
        "Invalid response. Please enter Ip:Port in the format 192.168.0.1:9001"
      );
      return;
    }
    await saveUser(userInput, chatId.toString())
      .then((result) => {
        if (result) {
          ctx.reply(
            `Found your node at ${userInput}. You are now subscribed to validator notifications`
          );
        } else {
          ctx.reply(
            `Could not find a node at ${userInput}. Please check the IP, or try installing again.`
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });

    // Mark the user as no longer subscribing
    subscribingUsers.delete(chatId);
  } else {
    ctx.reply(
      `To start receiving notifications for your Validator, please use /subscribe\nTo stop the notifications, please use /unsubscribe`
    );
  }
});

export { bot, sendMessage };
