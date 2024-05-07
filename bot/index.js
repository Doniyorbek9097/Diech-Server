const { Telegraf, session } = require("telegraf");
require('./methods')
const { checkToken } = require("../middlewares/authBotMiddleware")

const stage = require("./scenes");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
bot.use(stage.middleware())
// bot.use(checkToken)

bot.hears("/start", (ctx) => ctx.scene.enter("startScene"));


bot.launch();

module.exports = bot;