const { Scenes: { BaseScene }, Markup } = require("telegraf");
const userModel = require("../models/user.model")

const templatesScene = new BaseScene("templatesScene")

const keyboard = Markup.keyboard([
    ['1', '2'],
    ['3', '4'],
    ['🔙 Orqaga qaytish']
]).resize()

templatesScene.enter((ctx) => {
    const text = "<b>🔵 Kerakli sertifikatni tanlang.</b>\n<i>Eslatma. Hozir tanlagan sertifikatingiz siz tuzadigan keyingi testlarda test qatnashchilari uchun beriladi.</i>";
    ctx.replyWithPhoto({ source: './testbot/certificates/templates.jpg' }, {
        caption: text,
        parse_mode: 'HTML',
        ...keyboard
    })
})


templatesScene.hears("1", (ctx) => getCertificate(ctx))
templatesScene.hears("2", (ctx) => getCertificate(ctx))
templatesScene.hears("3", (ctx) => getCertificate(ctx))
templatesScene.hears("4", (ctx) => getCertificate(ctx))

const getCertificate = async (ctx) => {
    try {
        const imageMap = { '1': 'image-1.jpg', '2': 'image-2.jpg', '3': 'image-3.jpg', '4': 'image-4.jpg' };
        const imagePath = imageMap[ctx.message.text] || 'image-1.jpg';
        const updateUser = await userModel.findOneAndUpdate({ 'userid': ctx.chat.id }, { 'template': imagePath })
            .catch((err) => console.log(err))

        const text = "<b>✅ Yaxshi endi ushbu sertifikat siz tuzadigan test qatnashchilariga beriladi.</b>";
        await ctx.replyWithPhoto({ source: `./testbot/certificates/instructions/${imagePath}` }, {
            caption: text,
            parse_mode: 'HTML',
        })

        await ctx.scene.enter("startScene");
    } catch (error) {
        console.log(error);
        ctx.reply(error.message)
    }
}


templatesScene.hears("🔙 Orqaga qaytish", async (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.scene.enter('startScene');
    }
})




module.exports = templatesScene;