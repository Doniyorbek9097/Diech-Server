const { Scenes: { BaseScene }, Markup } = require("telegraf");
const channelModel = require("../models/channel.model")

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

homeScene.hears("📘 Qo'llanma", (ctx) => {
    ctx.reply("Hozircha qo'llanma mavjud emas!")
})

homeScene.hears("👨‍⚕️ Admin", (ctx) => {
    ctx.reply("@fakhraddini_matematik")
})


homeScene.on("message", async (ctx, next) => {
    try {
        const channels = await channelModel.find();
        let nonMembers = [];

        for (const channel of channels) {
            let mem = await ctx.telegram.getChatMember(channel.username, ctx.from.id);
            if (mem.status == 'left') nonMembers.push(mem.status);
        }

        if (nonMembers.includes("left")) return ctx.scene.enter("registerScene")
        else next()
    
    } catch (error) {
        console.log(error)
        ctx.reply(error.message)
    }
})


module.exports = homeScene;