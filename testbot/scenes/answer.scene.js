const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../models/test.model");
const userModel = require("../models/user.model");

const answerScene = new WizardScene("answerScene",
    async (ctx) => {
        await ctx.replyWithHTML('✍️ Test kodini yuboring.');
        ctx.wizard.next();
    },

    async (ctx) => {
        if(isNaN(ctx.message.text)) return ctx.reply("raqam bo'lishi kerak");
        const test = await testModel.findOne({ code: ctx.message.text })
            .populate({
                path: "answers.user",
                match: { userid: ctx.chat.id }
            })
            .populate("author")

        if (!test) return ctx.reply("Kodingiz xato");
        const foundUser = test.answers.find(item => item.user?.userid.toString() == ctx.chat.id.toString())
        if (foundUser) {
            let text = `<b>🔴 Ushbu testda avval qatnashgansiz\n✅ Natija:</b> ${foundUser.ball / 10} ta\n<b>🎯 Sifat:</b> ${foundUser.ball}%\n<b>⏱️ 2024-08-15 08:16:51</b>`;
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
    
            await testModel.findByIdAndUpdate(test._id, {
                $push: { answers: { user: user._id, ball } }
            });
    
            const userText = `<b>💡 Natijangiz:</b>\n<b>✅ To'g'ri javoblar:</b> ${correctCount} ta\n<b>❌ Noto'g'ri javoblar:</b> ${incorrectCount} ta\n<b>📊 Sifat:</b> ${ball.toFixed(1)}%\n\n${result}`;
    
            const authorText = `${test.code} kodli oddiy testda ${user?.firstname} ${user?.lastname} qatnashdi!\n✅ Natija: ${correctCount} ta\n🎯 Sifat darajasi: ${ball.toFixed(1)}%\n⏱️ 15.08.2024 08:16`;
    
            await ctx.replyWithHTML(userText);
            await ctx.telegram.sendMessage(test.author.userid, authorText, {
                ...Markup.inlineKeyboard([
                    Markup.button.callback("📊Holat", "stat"),
                    Markup.button.callback("⌛Yakunlash", "closed")
                ])
            });
            await ctx.scene.enter("homeScene");
    
        } catch (error) {
            console.log(error);
        }
    }
    
        
);

answerScene.use((ctx, next) => ctx?.message?.text && next());
answerScene.hears('/start', ctx => ctx.scene.enter('start'));

answerScene.action('closed', async (ctx) => {
    console.log(ctx.wizard.state.test)
})

module.exports = answerScene;
