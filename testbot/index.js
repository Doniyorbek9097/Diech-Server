const { Telegraf, session } = require("telegraf")
require("dotenv/config")
const stage = require('./scenes/stage')

const bot = new Telegraf(process.env.TEST_BOT_TOKEN)


bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => ctx.scene.enter("start"));

bot.on("callback_query", (ctx,next) => {
  let location =  ctx.callbackQuery.data; 
  if(!isJSON(location)) return next();
  const { latitude, longitude } = JSON.parse(location);
  return ctx.telegram.sendLocation(ctx.chat.id,latitude,longitude); 
})


bot
.launch(() => console.log("bot ishga tushdi"))
.catch((err) => console.log("Botga ulanib bo'lmadi"))