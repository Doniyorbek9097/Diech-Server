const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model");
const userModel = require("../../models/user.model");
const { format } = require('date-fns');

const answerSpecialScene = new WizardScene("answerSpecialScene",
    async (ctx) => {
        await ctx.replyWithHTML('✍️ Test kodini yuboring.');
        ctx.wizard.next();
    },

    async (ctx) => {
        if (isNaN(ctx.message.text)) return ctx.reply("raqam bo'lishi kerak");
        const test = await testModel.findOne({ code: ctx.message.text })
        .populate({
            path: "answers.user",
            match: { 'userid': ctx.chat.id }
        })
        .populate("author");

        if (!test) return ctx.replyWithHTML("<b>❗️ Test kodi noto'g'ri, tekshirib qaytadan yuboring.</b>");
        if (test.closed) return ctx.replyWithHTML("<b>❗️ Test yakunlangan, javob yuborishda kechikdingiz. Keyingi testlarda faol bo'lishingizni so'raymiz.</b>");

        const foundUser = test.answers.find(item => item.user?.userid.toString() == ctx.chat.id.toString())
        if (foundUser) {
            let text = `<b>🔴 Ushbu testda avval qatnashgansiz</b>\n<b>💡Natijangiz:</b>\n<b>✅ To'g'ri javoblar:</b> ${foundUser.correctAnswerCount} ta\n<b>❌ Noto'g'ri javoblar:</b> ${foundUser.wrongAnswerCount} ta\n<b>📊 Sifat:</b> ${foundUser.ball}%\n\n${foundUser.status}`;
            return ctx.replyWithHTML(text);
        }

        ctx.wizard.state.test = test;
        await ctx.replyWithHTML(`<b>✍️ ${test.code} kodli testda ${test.keyword.length} ta kalit mavjud. Marhamat, o'z javoblaringizni yuboring.</b>\n\nM-n: abcd yoki 1a2b3c4d`);
        ctx.wizard.next();
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

// answerSpecialScene.use((ctx, next) => ctx?.message?.text && next());
answerSpecialScene.hears('/start', ctx => ctx.scene.enter('start'));

answerSpecialScene.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.scene.enter('startScene');
    }
})


module.exports = answerSpecialScene;