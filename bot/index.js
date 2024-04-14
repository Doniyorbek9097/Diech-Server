const { Telegraf } = require("telegraf");

const bot = new Telegraf("6916398917:AAEh3Z0Wdqj-KHyF2vWHBkvZJ_NznTRrmoc");

bot.start((ctx) => ctx.reply("salom"));


bot.launch();

module.exports = bot;