const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model");
const userModel = require("../../models/user.model");
const { format } = require('date-fns');

const answerMultipleScene = new WizardScene("answerMultipleScene",
    async (ctx) => {
        try {
            const { test } = ctx.wizard.state;
            let text = `Blok test ma'lumotlari:\n`;
            test.keywords.forEach((item, index) => {
                text += `❕ Blok: ${index + 1}\n📚 Fan: ${item.title}\n❔ Savollar: ${item.keyword.length} ta\n📊 Ball: ${item.ball}\n\n`;
            })
            text += `<b>✍️ Yuqorida blok test ma'lumotlari bilan tanishishingiz mumkin va o'z javoblaringizni quyidagicha yuborishingiz zarur.</b>\n1-fan javoblari\n2-fan javoblari\n3-fan javoblari\n...\nM-n:\nabcdbdcbcbdbdbcb\nabcbdbdbbcbcbcbc\nadbabdbaadbcdabd`
            await ctx.replyWithHTML(text);
            ctx.wizard.next();
        } catch (error) {
            console.log(error)
        }
    },
    async (ctx) => {
        try {
            const { test } = ctx.wizard.state;
            const answer = ctx.message.text.toLowerCase();
            const user = await userModel.findOne({ userid: ctx.chat.id });
            const date = format(new Date(), 'dd.MM.yyyy HH:mm:ss');
    
            let overallCorrectCount = 0;
            let overallIncorrectCount = 0;
            let overallBall = 0;
            let results = [];
    
            for (const [index, item] of test.keywords.entries()) {
                let correctCount = 0;
                let incorrectCount = 0;
    
                const result = item.keyword.toLowerCase().split('').map((ch, i) => {
                    if (i < answer.length && ch === answer[i]) {
                        correctCount++;
                        return `${i + 1}-✅`;
                    } else {
                        incorrectCount++;
                        return `${i + 1}-❌`;
                    }
                }).join(' ');
    
                const ball = (correctCount / item.keyword.length) * 100;
                overallCorrectCount += correctCount;
                overallIncorrectCount += incorrectCount;
                overallBall += ball;
    
                const text = `💡 Blok: ${index + 1}\n📚 Fan: ${item.title}\n✅ To'g'ri javoblar: ${correctCount} ta\n❌ Noto'g'ri javoblar: ${incorrectCount} ta\n📊 Sifat: ${ball}%\n\n${result}`;
                await ctx.replyWithHTML(text);
    
                results.push({ correctCount, incorrectCount, ball, result });
            }
    
            overallBall = overallBall / test.keywords.length; // O'rtacha sifat
    
            await testModel.findByIdAndUpdate(test._id, {
                $push: {
                    answers: results.map((res, i) => ({
                        user: user._id,
                        tgid: ctx.chat.id,
                        ball: res.ball,
                        status: res.result,
                        correctAnswerCount: res.correctCount,
                        wrongAnswerCount: res.incorrectCount,
                        date: date
                    }))
                }
            });
    
            const userText = `<b>💡 Umumiy natija:</b>\n<b>Bloklar:</b> ${overallCorrectCount} ball\n<b>❌ Noto'g'ri javoblar:</b> ${overallIncorrectCount} ta\n<b>📊 O'rtacha sifat:</b> ${overallBall}%`;
            const authorText = `${test.code} kodli oddiy testda ${user?.firstname} ${user?.lastname} qatnashdi!\n✅ Natija: ${overallCorrectCount} ta\n🎯 O'rtacha sifat darajasi: ${overallBall}%\n⏱️ ${date}`;
            
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

// answerMultipleScene.use((ctx, next) => ctx?.message?.text && next());
answerMultipleScene.hears('/start', ctx => ctx.scene.enter('start'));

answerMultipleScene.on("callback_query", async (ctx) => {
    const query = ctx.callbackQuery.data;
    const queryArray = query.split("-");

    const [event, testId, userId] = queryArray;

    if (event == "stat") {
        const test = await testModel.findOne({ '_id': testId, 'answers.user': userId })
            .populate({
                path: "answers.user",
            })

        console.log(test)

        await ctx.reply("test yaklandi")
        await ctx.scene.enter("homeScene")
    }

    if (queryArray[0] == "closed") {
        await testModel.findOneAndUpdate({ '_id': queryArray[1] }, { 'closed': true });
        await ctx.reply("test yaklandi")
        await ctx.scene.enter("homeScene")
    }


})

// answerMultipleScene.action('closed', async (ctx) => {
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


module.exports = answerMultipleScene;
