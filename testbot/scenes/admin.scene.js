const { Scenes: { BaseScene }, Markup } = require("telegraf");
const userModel = require('../models/user.model')
const channelModel = require("../models/channnel.model")
const testModel = require("../models/test.model")

const adminScene = new BaseScene("adminScene")

const keyboards = Markup.keyboard([
    ["✍️ Test yaratish", "✅ Javobni tekshirish"],
    ["🎉 Sertifikatlar", "⚙️ Sozlamalar"],
    ["📊 Statistika", "📤 Habar yuborish"],
    ["📢 Kanallar"],
    ["🧹 Barcha testlarni o'chirish"]

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
        if (!user && !user.isAdmin) return;
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
    if (!user && !user.isAdmin) return;
    await ctx.scene.enter("sendScene")
})


adminScene.hears("🧹 Barcha testlarni o'chirish", async (ctx) => {
    try {
        const txt = `<b>Rostdan ham o'chirmoqchimisiz ?</b>\nBarcha testlar o'chib ketadi va hammasi 0 dan boshlanadi`;
        const keyboard = Markup.keyboard([
            ["🗑️ Barchasini tozalash"],
            ["🔙 Orqaga qaytish"]
        ]).resize()

        return await ctx.replyWithHTML(txt, keyboard);
    } catch (error) {
        console.log(error)
    }
})


adminScene.hears("🗑️ Barchasini tozalash", async (ctx) => {
    try {
        await testModel.deleteMany({});
        ctx.reply("Barchasi testlar o'chirildi")
    } catch (error) {
        console.log(error);
    }
})


adminScene.hears("📢 Kanallar", async (ctx) => {
    try {
        const user = await userModel.findOne({ 'userid': ctx.chat.id })
        if (!user && !user.isAdmin) return;
        const channels = await channelModel.find();
        let txt = `<b>Barcha 📢 Kanallar:</b>\n`;
        channels.forEach((channel, index) => {
            txt += `${index + 1}. ${channel.username}\n`;
        })

        const keyboard = Markup.keyboard([
            ["Qo'shish"],
            ["O'chirish"],
            ["🔙 Orqaga qaytish"],

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

adminScene.hears("🔙 Orqaga qaytish", (ctx) => ctx.scene.enter("startScene"))


module.exports = adminScene;