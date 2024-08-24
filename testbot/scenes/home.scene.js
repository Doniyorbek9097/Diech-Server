const { Scenes:{BaseScene}, Markup } = require("telegraf");
const { hears } = require("./answer.scene");


const homeScene = new BaseScene("homeScene")

const keyboards = Markup.keyboard([
    ["✍️ Test yaratish", "✅ Javobni tekshirish"],
    ["🎉 Sertifikatlar", "⚙️ Sozlamalar"],
    ["📘 Qo'llanma", "👨‍⚕️ Admin"]

]).resize()


homeScene.enter((ctx) => {
    ctx.reply(`Asosiy Sahifa`, keyboards)
})

homeScene.hears("✍️ Test yaratish", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("createTestMenu")
})

homeScene.hears("✅ Javobni tekshirish", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("answerMainScene")
})


homeScene.hears("🎉 Sertifikatlar", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("certificateScene")
})

homeScene.hears("⚙️ Sozlamalar", async (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("settingsScene")
})




module.exports = homeScene;