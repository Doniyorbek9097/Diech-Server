const { Scenes: { WizardScene}, Markup } = require("telegraf")
const channelModel = require("../models/channnel.model")


    const addChannelScene = new WizardScene(
    "addChannelScene",
    async ctx => {
        try {
            const txt = `Kanal <b>username</b> ni jo'nating\n<i>Expamle</i>: <b>@DJ_XITS</b>`;
            const keyboard = Markup.keyboard([["🔙Bekor qilish"]]).resize();
            await ctx.replyWithHTML(txt, keyboard)
            ctx.wizard.next()
        } catch (error) {
            console.log(error)
        }
    },

    async ctx => {
      if(!ctx.message) return;
      if(!ctx.message.text.startsWith("@")) return ctx.replyWithHTML(txt);
      const username = ctx.message.text.trim().toUpperCase();
      const channel = await channelModel.findOne({username});
      if(channel) return ctx.reply(`${channel.username} avvaldan mavjud!`);
      const ch = await channelModel({ username }).save();
    
      await ctx.replyWithHTML(`<b>${ch.username} kanallar ro'yxatiga qo'shildi</b>`);
      return ctx.scene.enter("adminScene");
      
    }
      
    );


    addChannelScene.hears("🔙Bekor qilish", ctx => ctx.scene.enter("adminScene"))

    module.exports = addChannelScene;