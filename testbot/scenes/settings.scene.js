const { Scenes:{BaseScene}, Markup } = require("telegraf");


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
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("createTestMenu")
})


settingsScene.hears("✍️ Familya", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("createTestMenu")
})



settingsScene.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.scene.enter('homeScene');
    }
})




module.exports = settingsScene;