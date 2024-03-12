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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.bot = void 0;
const telegraf_1 = require("telegraf");
const api_1 = require("./api");
const { message } = require("telegraf/filters");
if (!process.env.BOT_TOKEN) {
    throw new Error("Env var BOT_TOKEN must be provided!");
}
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
exports.bot = bot;
function sendMessage(chatID, message) {
    return __awaiter(this, void 0, void 0, function* () {
        return bot.telegram.sendMessage(chatID, message);
    });
}
exports.sendMessage = sendMessage;
// Bot commands
bot.start((ctx) => ctx.reply("Welcome! Please use /subscribe to start receiving notifications."));
bot.help((ctx) => ctx.reply(`To start receiving notifications for your Validator, please use /subscribe
  To stop receiving notifications, please use /unsubscribe`));
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
    (0, api_1.stopNotifications)(ctx.chat.id.toString())
        .then(() => ctx.reply("You have successfully unsubscribed."))
        .catch((err) => {
        console.error("Error stopping notifications:", err);
    });
});
bot.on(message("text"), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const chat = yield ctx.getChat();
    const chatId = chat.id;
    // Check if the user is in the process of subscribing
    if (subscribingUsers.get(chatId)) {
        const userInput = ctx.text;
        if (!userInput) {
            ctx.reply("Invalid response. Please enter Ip:Port in the format 192.168.0.1:9001");
            return;
        }
        // Check if the user input is a valid IP:Port
        const ipPortRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}/;
        if (!ipPortRegex.test(userInput)) {
            ctx.reply("Invalid response. Please enter Ip:Port in the format 192.168.0.1:9001");
            return;
        }
        yield (0, api_1.saveUser)(userInput, chatId.toString())
            .then((result) => {
            if (result) {
                ctx.reply(`Found your node running at ${userInput}. You are now subscribed to validator notifications`);
            }
            else {
                ctx.reply(`Could not find a node running at ${userInput}. Please try installing again.`);
            }
        })
            .catch((error) => {
            console.log(error);
        });
        // Mark the user as no longer subscribing
        subscribingUsers.delete(chatId);
    }
    else {
        ctx.reply(`To start receiving notifications for your Validator, please use /subscribe
      To stop receiving notifications, please use /unsubscribe`);
    }
}));
