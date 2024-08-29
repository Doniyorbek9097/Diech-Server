const { Telegraf, session } = require("telegraf")
require("dotenv/config")
require("./prototypes")
require("./config/mongoDB")
const stage = require('./scenes/stage')
const testModel = require("./models/test.model")
const userModel = require("./models/user.model")


const bot = new Telegraf(process.env.TEST_BOT_TOKEN)


bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => ctx.scene.enter("startScene"));

bot.on("callback_query", async (ctx) => {
  try {
      const query = ctx.callbackQuery.data;
      const queryArray = query.split("-");

      const [event, testId, userId] = queryArray;
      
      if (event == "stat") {
          const test = await testModel.findOne({ '_id': testId, 'answers.user': userId })
              .populate({
                  path: "answers.user",
              })

          await ctx.reply("test yaklandi")
          await ctx.scene.enter("homeScene")
      }

      if (event == "closed") {
          try {
              await testModel.findOneAndUpdate({ '_id': testId }, { 'closed': true });
              await ctx.reply("test yaklandi")
              await ctx.scene.enter("homeScene")
          } catch (error) {
              console.log(error)
          }
      }

  } catch (error) {
      console.log(error)
  }

})


bot
.launch(() => console.log("bot ishga tushdi"))
.catch((err) => console.log("Botga ulanib bo'lmadi"))