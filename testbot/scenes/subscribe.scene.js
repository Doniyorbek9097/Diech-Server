const { Scenes, Markup, session } = require("telegraf");
const userModel = require("../models/user.model");
const channelModel = require("../models/channnel.model");

const subscribeScene = new Scenes.BaseScene("subscribeScene")

subscribeScene.enter(async (ctx) => {
    try {
        const channels = await channelModel.find();
        let nonMembers = [];

        if (!channels?.length) return ctx.scene.enter("registerScene");

        for (const channel of channels) {
            const botId = ctx.botInfo.id;

            const nonMembersBot = await ctx.telegram.getChatMember(channel.username, botId)
                .catch(err => ctx.scene.enter("registerScene"));

            let nonMembersUser = await ctx.telegram.getChatMember(channel.username, ctx.from.id)
            if (nonMembersUser.status == 'left') nonMembers.push(nonMembersUser.status);
        }


        let user = await userModel.findOne({ 'userid': ctx.from.id });
        if (user && !nonMembers.includes("left")) {
            if (user.isAdmin) return ctx.scene.enter("adminScene");
            return ctx.scene.enter("registerScene")
        }


        if (!nonMembers.includes("left")) return ctx.scene.enter("registerScene");
        let txt = `<b>Assalomu alaykum! <b>@${ctx.chat.first_name}</b>
 
  Siz ❗️<b>@${ctx.botInfo.username}</b> dan foydalanish uchun avval quyidagi kanallarga obuna bo‘ling:</b>`;


        let btns = [];

        channels.forEach((channel, index) => {
            if (index == 0)
                btns.push(Markup.button.url(`1️⃣-Kanal`, `${channel.username.replace("@", "https://t.me/")}`));
            if (index == 1)
                btns.push(Markup.button.url(`2️⃣-Kanal`, `${channel.username.replace("@", "https://t.me/")}`));
            if (index == 2)
                btns.push(Markup.button.url(`3️⃣-Kanal`, `${channel.username.replace("@", "https://t.me/")}`));
            if (index > 2)
                btns.push(Markup.button.url(`📢 ${channel.username.replace("@", "").toUpperCase()}`, `${channel.username.replace("@", "https://t.me/")}`));
        });


        let btn = Markup.inlineKeyboard([
            ...btns,
            Markup.button.callback("Azo bo'ldim ✅", "subscribeScened")
        ], { columns: 1 });

        return await ctx.replyWithHTML(txt, btn);

    } catch (error) {
        console.log(error);
        ctx.reply(error.message)
    }

});



subscribeScene.action("subscribeScened", async ctx => {
    try {
        const channels = await channelModel.find();
        let nonMembers = [];

        for (const channel of channels) {
            let mem = await ctx.telegram.getChatMember(channel.username, ctx.from.id);
            if (mem.status == 'left') nonMembers.push(mem.status);
        }

        if (nonMembers.includes("left"))
            return ctx.answerCbQuery("Botdan foydalanish uchun ko'rsatilgan kanallarga obuna bo'ling!", { show_alert: true });
        return ctx.scene.enter("registerScene")
    } catch (error) {
        console.log(error);
        ctx.reply(error.message)
    }

})

subscribeScene.command("start", ctx => ctx.scene.enter("startScene"));

module.exports = subscribeScene;