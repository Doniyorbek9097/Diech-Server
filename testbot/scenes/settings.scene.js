const { Scenes: { BaseScene }, Markup } = require("telegraf");
const userModel = require("../models/user.model")

const backPage = async (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.scene.enter('startScene');
    }
}


const settingsScene = new BaseScene("settingsScene")

const keywords = Markup.keyboard([
    ["🎉 Sertifikat tanlash"],
    ["✍️ Ism", "✍️ Familya"],
    ["🔙 Orqaga qaytish"]

]).resize()


settingsScene.enter((ctx) => {
    ctx.reply("🛠️ Kerakli bo'limni tanlang.", keywords)
})

settingsScene.hears("🎉 Sertifikat tanlash", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id)
    ctx.scene.enter("templatesScene")
})

settingsScene.hears("✍️ Ism", (ctx) => {
    ctx.reply("yangi ismingizni kiriting")
    ctx.session.isFirstName = true;
    ctx.session.isLastName = false;

})


settingsScene.hears("✍️ Familya", (ctx) => {
    ctx.reply("yangi familyangizni kiriting")
    ctx.session.isFirstName = false;
    ctx.session.isLastName = true;
})

settingsScene.hears("🔙 Orqaga qaytish", backPage)


settingsScene.on("text", async (ctx, next) => {
    const buttons = ['🎉 Sertifikat tanlash', '✍️ Ism', '✍️ Familya', '🔙 Orqaga qaytish']
    const userInput = ctx.message.text.trim();
    if (buttons.includes(userInput)) return next();

    if (ctx.session.isFirstName) {
        await userModel.findOneAndUpdate({ 'userid': ctx.chat.id }, { 'firstname': userInput })
        ctx.session.isFirstName = false;
        await ctx.reply("Ismingiz o'zgartildi")
    }

    if (ctx.session.isLastName) {
        await userModel.findOneAndUpdate({ 'userid': ctx.chat.id }, { 'lastname': userInput })
        ctx.session.isLastName = false;
        await ctx.reply("Familyangiz o'zgartildi")
    }

})




module.exports = settingsScene;