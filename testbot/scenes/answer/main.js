const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model");
const userModel = require("../../models/user.model");


const answerMainScene = new WizardScene("answerMainScene",
    async (ctx) => {
        try {
            const keyboard = Markup.keyboard([['🔙 Orqaga qaytish']]).resize();
            await ctx.replyWithHTML('✍️ Test kodini yuboring.', keyboard);
            ctx.wizard.next();
        } catch (error) {
            console.log(error);
        }
    },

    async (ctx) => {
        try {
            if (isNaN(ctx.message.text)) return ctx.reply("raqam bo'lishi kerak");
            const test = await testModel.findOne({ code: ctx.message.text })
                .populate({
                    path: "answers.user",
                    match: { 'userid': ctx.chat.id }
                })
                .populate("author");

            if (!test) return ctx.replyWithHTML("<b>❗️ Test kodi noto'g'ri, tekshirib qaytadan yuboring.</b>");
            if (test.closed) {
                await ctx.replyWithHTML("<b>❗️ Test yakunlangan, javob yuborishda kechikdingiz. Keyingi testlarda faol bo'lishingizni so'raymiz.</b>");
                return;
            }

            const foundUser = test.answers.find(item => item.user?.userid.toString() == ctx.chat.id.toString())
            if (foundUser) {
                let text = `<b>🔴 Ushbu testda avval qatnashgansiz</b>\n<b>💡Natijangiz:</b>\n<b>✅ To'g'ri javoblar:</b> ${foundUser.correctAnswerCount} ta\n<b>❌ Noto'g'ri javoblar:</b> ${foundUser.wrongAnswerCount} ta\n<b>📊 Sifat:</b> ${foundUser.ball}%\n\n${foundUser.status}`;
                await ctx.replyWithHTML(text);
                return;
            }

            if (test.photo) {
                ctx.session.history.push(ctx.scene.current.id)
                return ctx.scene.enter("answerSpecialScene", { test });
            }

            if (test.keywords.length) {
                ctx.session.history.push(ctx.scene.current.id)
                return ctx.scene.enter("answerMultipleScene", { test });
            }

            if (test.title) {
                ctx.session.history.push(ctx.scene.current.id)
                return ctx.scene.enter("answerSubjectScene", { test });
            }

            else {
                ctx.session.history.push(ctx.scene.current.id)
                return ctx.scene.enter("answerSimpleScene", { test })
            }



        } catch (error) {
            console.log(error)
            await ctx.reply(error.message);
        }
    }
);


// answerMainScene.use((ctx, next) => ctx?.message?.text && next());
answerMainScene.hears('/start', ctx => ctx.scene.enter('startScene'));

answerMainScene.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.scene.enter('startScene');
    }
})

module.exports = answerMainScene;
