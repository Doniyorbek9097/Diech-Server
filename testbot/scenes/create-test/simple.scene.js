const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model")
const userModel = require("../../models/user.model")


const createTestSimple = new WizardScene("createTestSimple",
    async (ctx) => {
        let text = "✍️ Test javoblarini yuboring.\nM-n: abcd... yoki 1a2b3c4d...❕\n\n Javoblar faqat lotin alifbosida bo'lishi shart."
        ctx.reply(text, {
            ...Markup.keyboard(['🔙 Orqaga qaytish']).resize()
        })

        ctx.wizard.next()
    },

    async (ctx) => {
        if (!ctx?.message?.text) return;
        const user = await userModel.findOne({ userid: ctx.chat.id })
        if (!user) return ctx.scene.enter("register");
        const testLength = await testModel.countDocuments()
        const newTest = await new testModel({
            keyword: ctx?.message.text,
            author: user._id,
            code: testLength + 1 || 1,
        }).save()

        const text = `<b>✅ Test bazaga qo'shildi.</b>
<b>👨‍🏫 Muallif:</b> ${user?.firstname} ${user?.lastname}
<b>✍️ Test kodi:</b> ${newTest.code}
<b>🔹 Savollar:</b> ${newTest.keyword.length} ta
<b>📆 14.08.2024 ⏰</b> 21:37`;

        ctx.replyWithHTML(text, {
            ...Markup.keyboard(['🔙 Orqaga qaytish']).resize()
        })
    },

)



createTestSimple.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.reply('Oldingi sahna mavjud emas');
    }
})


module.exports = createTestSimple;