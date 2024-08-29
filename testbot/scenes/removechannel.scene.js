const { Scenes: { WizardScene }, Markup } = require("telegraf")
const channelModel = require("../models/channnel.model")


const removeChannelScene = new WizardScene(
    "removeChannelScene",
    async ctx => {
        try {
            const txt = `Kanal <b>username</b> ni jo'nating\n<i>Expamle</i>: <b>@DJ_XITS</b>`;
            const keyboard = Markup.keyboard([["🔙Bekor qilish"]]).resize();
            await ctx.replyWithHTML(txt, keyboard)
            ctx.wizard.next()
        } catch (error) {
            console.log(error)
            await ctx.replyWithHTML(error.message)
        }
    },

    async ctx => {
        try {
            if (!ctx.message) return;
            const username = ctx.message.text.trim().toUpperCase();
            const channel = await channelModel.findOne({ username });
            if (!channel) return ctx.reply(`${ username } Bunday kanal topilmadi!`);
            const deleted = await channelModel.findOneAndRemove({username:channel.username})
            await ctx.replyWithHTML(`<b>${deleted.username} kanal o'chirildi</b>`);
            return ctx.scene.enter("startScene");
        } catch (error) {
            console.log(error)
            await ctx.replyWithHTML(error.message)
        }
    }

);


removeChannelScene.hears("🔙Bekor qilish", ctx => ctx.scene.enter("startScene"))


module.exports = removeChannelScene;