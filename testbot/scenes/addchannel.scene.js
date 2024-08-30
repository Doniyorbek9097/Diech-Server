const { Scenes: { WizardScene }, Markup } = require("telegraf")
const channelModel = require("../models/channnel.model")


const addChannelScene = new WizardScene(
    "addChannelScene",
    async ctx => {
        try {
            const txt1 = `<b>Kanal qo'shishdan avval shu botni kanalingizga admin qiling.\n❗Agar bot kanalingizda Admin bo'lmasa kanalingizga majburiy obuna qo'ymaydi.</b>`;
            const keyboard = Markup.keyboard([["🔙Bekor qilish"]]).resize();
            await ctx.replyWithHTML(txt1, keyboard)
            const txt2 = `Kanalingizni<b>username</b> ni jo'nating\n<i>Expamle</i>: <b>@DJ_XITS</b>`;
            await ctx.replyWithHTML(txt2, keyboard)
            ctx.wizard.next()
        } catch (error) {
            console.log(error)
            await ctx.reply(error.message);
        }
    },

    async ctx => {
        try {
            if (!ctx.message) return;
            if (!ctx.message.text.startsWith("@")) return ctx.replyWithHTML(txt);
            const username = ctx.message.text.trim().toUpperCase();
            const channel = await channelModel.findOne({ username });
            if (channel) return ctx.reply(`${channel.username} avvaldan mavjud!`);
            const ch = await channelModel({ username }).save();

            await ctx.replyWithHTML(`<b>${ch.username} kanallar ro'yxatiga qo'shildi</b>`);
            return ctx.scene.enter("startScene");

        } catch (error) {
            console.log(error)
            await ctx.reply(error.message)
        }
    }

);


addChannelScene.hears("🔙Bekor qilish", ctx => ctx.scene.enter("startScene"))

module.exports = addChannelScene;