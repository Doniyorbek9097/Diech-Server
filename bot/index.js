const { Telegraf, session } = require("telegraf");
const { checkToken } = require("../middlewares/authBotMiddleware")

const stage = require("./scenes");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
bot.use(stage.middleware())
// bot.use(checkToken)

bot.hears("/help", (ctx) => ctx.scene.enter("startScene"));


bot.launch();

module.exports = bot;