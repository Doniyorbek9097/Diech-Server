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
            const test = await testModel.findOne({ '_id': testId })
                .populate('answers.user');
            
            // Javoblarni ball bo'yicha yuqoridan pastga saralash
            test.answers.sort((a, b) => b.ball - a.ball);
        
            let txt = `<b>${test.code}</b> sonli test natijalari\n`;
            test.answers.forEach(({user, ball}, index) => {
                txt += `${index + 1}. ${user.firstname} ${user.lastname} - <b>${ball}</b> ball\n`; 
            });
        
            await ctx.replyWithHTML(txt);
        }

        if (event == "closed") {
            await testModel.findOneAndUpdate({ '_id': testId }, { 'closed': true });
            await ctx.reply("test yaklandi")
            await ctx.scene.enter("startScene")
        }

    } catch (error) {
        console.log(error)
        await ctx.reply(error.message)
    }

})


bot
    .launch(() => console.log("bot ishga tushdi"))
    .catch((err) => console.log("Botga ulanib bo'lmadi"))