const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model");
const userModel = require("../../models/user.model");


const answerMainScene = new WizardScene("answerMainScene",
    async (ctx) => {
        await ctx.replyWithHTML('✍️ Test kodini yuboring.');
        ctx.wizard.next();
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
                await ctx.scene.reenter();
            }

            const foundUser = test.answers.find(item => item.user?.userid.toString() == ctx.chat.id.toString())
            if (foundUser) {
                let text = `<b>🔴 Ushbu testda avval qatnashgansiz</b>\n<b>💡Natijangiz:</b>\n<b>✅ To'g'ri javoblar:</b> ${foundUser.correctAnswerCount} ta\n<b>❌ Noto'g'ri javoblar:</b> ${foundUser.wrongAnswerCount} ta\n<b>📊 Sifat:</b> ${foundUser.ball}%\n\n${foundUser.status}`;
                await ctx.replyWithHTML(text);
                await ctx.scene.reenter();
            }

            if(test.photo) return ctx.scene.enter("answerSpecialScene", { test });
            if(test.keywords.length) return ctx.scene.enter("answerMultipleScene", { test });
            if(test.title) return ctx.scene.enter("answerSubjectScene", { test });
            else return ctx.scene.enter("answerSimpleScene", { test });

                        

        } catch (error) {
            console.log(error)
        }
    }
);

// answerMainScene.use((ctx, next) => ctx?.message?.text && next());
answerMainScene.hears('/start', ctx => ctx.scene.enter('start'));

module.exports = answerMainScene;
