const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model");
const userModel = require("../../models/user.model");
const { format } = require('date-fns');

const answerSubjectScene = new WizardScene("answerSubjectScene",
    async (ctx) => {
        try {
            const { test } = ctx.wizard.state;
            await ctx.replyWithHTML(`<b>✍️ ${test.code} kodli testda ${test.keyword.length} ta kalit mavjud. Marhamat, o'z javoblaringizni yuboring.</b>\n\nM-n: abcd yoki 1a2b3c4d`);
            ctx.wizard.next();
        } catch (error) {
            console.log(error)
        }
    },

    async (ctx) => {
        try {
            const { test } = ctx.wizard.state;
            const answer = ctx.message.text.toLowerCase();

            // Javoblar va test nomi harflarini boshidan tekshirish
            let correctCount = 0;
            const result = test.keyword.toLowerCase().split('').map((ch, i) => {
                if (i < answer.length && ch === answer[i]) {
                    correctCount++;
                    return `${i + 1}-✅`;
                } else {
                    return `${i + 1}-❌`;
                }
            }).join(' ');

            // To'g'ri javoblar foizini hisoblash
            const ball = (correctCount / test.keyword.length) * 100;
            const incorrectCount = test.keyword.length - correctCount;
            const user = await userModel.findOne({ userid: ctx.chat.id });
            const date = format(new Date(), 'dd.MM.yyyy HH:mm:ss');

          await testModel.findByIdAndUpdate(test._id, {
                $push: {
                    answers: {
                        user: user._id,
                        tgid: ctx.chat.id,
                        ball: ball,
                        status: result,
                        correctAnswerCount: correctCount,
                        wrongAnswerCount: incorrectCount,
                        date: date
                    }
                },

            });


            const userText = `<b>💡 Natijangiz:</b>\n<b>✅ To'g'ri javoblar:</b> ${correctCount} ta\n<b>❌ Noto'g'ri javoblar:</b> ${incorrectCount} ta\n<b>📊 Sifat:</b> ${ball}%\n\n${result}`;
            const authorText = `${test.code} kodli oddiy testda ${user?.firstname} ${user?.lastname} qatnashdi!\n✅ Natija: ${correctCount} ta\n🎯 Sifat darajasi: ${ball}%\n⏱️ ${date}`;
        
            await ctx.replyWithHTML(userText);
            await ctx.telegram.sendMessage(test.author.userid, authorText, {
                ...Markup.inlineKeyboard([
                    Markup.button.callback("📊Holat", `stat-${test._id}-${user._id}`),
                    Markup.button.callback("⌛Yakunlash", `closed-${test._id}`)
                ])
            });
            await ctx.scene.enter("homeScene");

        } catch (error) {
            console.log(error);
        }
    }


);

// answerSubjectScene.use((ctx, next) => ctx?.message?.text && next());
answerSubjectScene.hears('/start', ctx => ctx.scene.enter('start'));

answerSubjectScene.on("callback_query", async (ctx) => {
    const query = ctx.callbackQuery.data;
    const queryArray = query.split("-");

    const [event, testId, userId] = queryArray;

    if (event == "stat") {
      const test = await testModel.findOne({'_id': testId, 'answers.user': userId })
      .populate({
        path:"answers.user",
      })

      console.log(test)

        await ctx.reply("test yaklandi")
        await ctx.scene.enter("homeScene") 
    }

    if (queryArray[0] == "closed") {
        await testModel.findOneAndUpdate({'_id': queryArray[1]}, { 'closed': true });
        await ctx.reply("test yaklandi")
        await ctx.scene.enter("homeScene")
    }


})

// answerSubjectScene.action('closed', async (ctx) => {
//     try {
//         const author = await userModel.findOne({'userid': ctx.chat.id});

//         if (!author) {
//             return ctx.reply("Foydalanuvchi topilmadi.");
//         }

//         const test = await testModel.findOneAndUpdate(
//             { 'author': author._id },
//             { 'closed': true },
//             { new: true } // yangilangan hujjatni qaytaradi
//         );

//         if (!test) {
//             return ctx.reply("Test topilmadi yoki yangilab bo'lmadi.");
//         }

//         await ctx.reply("Test yakunlandi.");
//         await ctx.scene.enter("homeScene");
//     } catch (err) {
//         console.error("Xatolik yuz berdi:", err);
//         await ctx.reply("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
//     }
// });


module.exports = answerSubjectScene;
