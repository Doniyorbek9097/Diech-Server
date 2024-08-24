const { format } = require('date-fns');
const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model")
const userModel = require("../../models/user.model")


const multipleScene = new WizardScene("multipleScene",
    async (ctx) => {
        const text = `✍️ Blok test ma'lumotlarini quyidagi ko'rinishda yuboring.

fan nomi 1/javoblar 1/ball 1
fan nomi 2/javoblar 2/ball 2
...

M-n:
Matematika/acbdabcdba/3.1
Fizika/bacdbcbcbcd/2.1
Ona tili/abcdbadbadbc/1.1

❗️ Fan nomi 20 ta belgidan oshmasligi shart, ball haqiqiy musbat son bo'lishi shart, javoblar soni 100 dan oshmasligi zarur. Fan va javoblar lotin alifbosida bo'lishi shart.`;

        ctx.reply(text, {
            ...Markup.keyboard(['🔙 Orqaga qaytish']).resize()
        })

        ctx.wizard.next()
    },

    async (ctx) => {
        try {
            const user = await userModel.findOne({ userid: ctx.chat.id })
            if (!user) return ctx.scene.enter("register");

            if (!ctx?.message?.text) return;
            const tests = ctx?.message?.text.split('\n');
            if(tests.length < 3) return ctx.scene.reenter();

            let keywords = tests.map(test => {
                const [title, keyword, ball] = test.split('/');
                return {title, keyword, ball};
            })
    
            const testLength = await testModel.countDocuments()
            let newTest = await new testModel({
                author: user._id,
                keywords,
                code: testLength + 1 || 1,
                date: format(new Date(), 'dd.MM.yyyy HH:mm:ss')
            }).save();

            const [date, hours] = newTest.date.split(" ");
            let text = `<b>✅ Test bazaga qo'shildi.</b>\n<b>👨‍🏫 Muallif:</b> ${user?.firstname} ${user?.lastname}\n<b>✍️ Test kodi:</b> ${newTest.code}\n<b>📆 ${date} ⏰ ${hours}</b>\n________________________________\n`;

            newTest.keywords.forEach((item, index) => {
                text += `<b>🔖${item.title}</b>\n<b>🔹Savollar:</b> ${item.keyword.length} ta\n<b>🔹Ball:</b> ${item.ball}\n--------------\n`;
            });

            await ctx.replyWithHTML(text)
            await ctx.scene.enter("homeScene");

        } catch (error) {
            console.log(error)
        }
    },

)



multipleScene.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.reply('Oldingi sahna mavjud emas');
    }
})


module.exports = multipleScene;