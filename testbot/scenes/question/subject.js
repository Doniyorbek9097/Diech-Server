const { format } = require('date-fns');
const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model")
const userModel = require("../../models/user.model")


const subjectScene = new WizardScene("subjectScene",
    async (ctx) => {
        let text = "✍️ Fan nomini yozing.\nM-n: Matematika, Ona tili yoki boshqa fanlar nomi"
        ctx.reply(text, {
            ...Markup.keyboard(['🔙 Orqaga qaytish']).resize()
        })

        ctx.wizard.next()
    },

    async (ctx) => {
        if (!ctx?.message?.text) return;
        ctx.wizard.state.title = ctx.message.text;
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
        const { title } = ctx.wizard.state;

        const newTest = await new testModel({
            title,
            keyword: ctx?.message.text,
            author: user._id,
            code: testLength + 1 || 1,
            date: format(new Date(), 'dd.MM.yyyy HH:mm:ss')
        }).save()

        const [date, hours] = newTest.date.split(" ");
        const text = `<b>✅ Test bazaga qo'shildi.</b>\n<b>👨‍🏫 Muallif:</b> ${user?.firstname} ${user?.lastname}\n<b>✍️ Test kodi:</b> ${newTest.code}\n<b>🔹 Savollar:</b> ${newTest.keyword.length} ta\n<b>📆 ${date} ⏰</b> ${hours}`;
        await ctx.replyWithHTML(text)
        await ctx.scene.enter("homeScene");
    },

)



subjectScene.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.reply('Oldingi sahna mavjud emas');
    }
})


module.exports = subjectScene;