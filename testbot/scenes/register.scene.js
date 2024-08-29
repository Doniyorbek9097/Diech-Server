const { Scenes: { WizardScene }, Markup } = require("telegraf");
const userModel = require("../models/user.model")


const registerScene = new WizardScene("registerScene",
    async (ctx) => {
        try {
            const user = await userModel.findOne({ userid: ctx.chat.id })
            if (user?.isAdmin) return ctx.scene.enter("adminScene")
            else if (user) return ctx.scene.enter("homeScene")
            ctx.wizard.state.user = {};
            ctx.wizard.state.user.userid = ctx.chat.id;
            ctx.reply("Ism familyangizni kiriting")
            ctx.wizard.next()
        } catch (error) {
            console.log(error);
            ctx.reply(error.message)
        }
    },

    async (ctx) => {
        try {
            if (ctx.message?.text == "/start") return ctx.scene.enter("startScene")
            const messages = ctx.message.text.split(" ");
            const text = `Ism familyangizni kiriting\nMasalan: Alisher Zokirov`;
            if (messages.length < 2) return ctx.reply(text);
            const [firstname, lastname] = messages;
            ctx.wizard.state.user.firstname = firstname;
            ctx.wizard.state.user.lastname = firstname;
            const newUser = await new userModel(ctx.wizard.state.user).save()
            newUser && ctx.scene.enter("homeScene");
        } catch {
            console.log(error)
            ctx.reply(error.message)
        }
    },


)


registerScene.use((ctx, next) => {
    if (!ctx?.message?.text) return;
    next()
})

module.exports = registerScene;