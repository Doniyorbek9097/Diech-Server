const { Telegraf, session } = require("telegraf");
const axios = require("axios");
require('./methods')
const { checkToken } = require("../middlewares/authBotMiddleware")

const stage = require("./scenes");

const bot = new Telegraf(process.env.BOT_TOKEN);


bot.use(session());
bot.use(stage.middleware())
// bot.use(checkToken)

// bot.hears("/start", (ctx) => ctx.scene.enter("startScene"));

bot.on('message', async (ctx) => {
    if (ctx.message?.location) {
      const location = ctx.message.location;
      const chatId = ctx.chat.id;
    
      // Fastify serveriga joylashuvni yuborish
      await axios.post('http://localhost:5000/location', {
        chatId,
        latitude: location.latitude,
        longitude: location.longitude
      });
  
      ctx.reply('Jonli joylashuv qabul qilindi!');
    }
  });


bot.launch();

module.exports = bot;