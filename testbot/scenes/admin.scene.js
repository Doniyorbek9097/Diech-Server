const { Scenes: { BaseScene }, Markup } = require("telegraf");
const userModel = require('../models/user.model')
const channelModel = require("../models/channnel.model")


const adminScene = new BaseScene("adminScene")

const keyboards = Markup.keyboard([
    ["✍️ Test yaratish", "✅ Javobni tekshirish"],
    ["🎉 Sertifikatlar", "⚙️ Sozlamalar"],
    ["📊 Statistika", "📤 Habar yuborish"],
    ["📢 Kanallar"]

]).resize()


adminScene.enter((ctx) => {
    ctx.reply(`Asosiy Sahifa`, keyboards)
})

adminScene.hears("✍️ Test yaratish", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id)
    ctx.scene.enter("createTestMenu")
})

adminScene.hears("✅ Javobni tekshirish", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id)
    ctx.scene.enter("answerMainScene")
})


adminScene.hears("🎉 Sertifikatlar", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id)
    ctx.scene.enter("certificateScene")
})

adminScene.hears("⚙️ Sozlamalar", async (ctx) => {
    ctx.session.history.push(ctx.scene.current.id)
    ctx.scene.enter("settingsScene")
})

adminScene.hears("📊 Statistika", async (ctx) => {
    try {
        ctx.session.history.push(ctx.scene.current.id)
    const user = await userModel.findOne({ 'userid': ctx.chat.id })
    if (!user) return;
    const totalDocuments = await userModel.countDocuments()
    const text = `<b>Bot azolari hozirda:</b> ${totalDocuments} ta`;
    await ctx.replyWithHTML(text)
    } catch (error) {
        console.log(error);
        await ctx.replyWithHTML(text)
    }
})


adminScene.hears("📤 Habar yuborish", async (ctx) => {
    ctx.session.history.push(ctx.scene.current.id)
    const user = await userModel.findOne({ 'userid': ctx.chat.id })
    if (!user) return;
    await ctx.scene.enter("sendScene")
})


adminScene.hears("📢 Kanallar", async (ctx) => {
    try {
        const channels = await channelModel.find();
        let txt = `<b>Barcha 📢 Kanallar:</b>\n`;
        channels.forEach((channel, index) => {
            txt += `${index + 1}. ${channel.username}\n`;
        })
        
        const keyboard = Markup.keyboard([
            ["Qo'shish"],
            ["O'chirish"],
            ["🔙 Bekor qilish"],

        ]).resize()

        await ctx.replyWithHTML(txt, keyboard)

    } catch (error) {
        console.log(error)
        await ctx.reply(error.message)
    }
})


adminScene.hears("Qo'shish", async ctx => {
    ctx.session.history.push(ctx.scene.current.id)
    return ctx.scene.enter("addChannelScene")
})

adminScene.hears("O'chirish", async ctx => {
    ctx.session.history.push(ctx.scene.current.id)
    return ctx.scene.enter("removeChannelScene")
})

adminScene.hears("🔙 Bekor qilish", (ctx) => ctx.scene.enter("startScene"))


module.exports = adminScene;