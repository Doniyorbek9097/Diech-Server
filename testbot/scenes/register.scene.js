const { Scenes: { WizardScene }, Markup } = require("telegraf");
const userModel = require("../models/user.model")


const register = new WizardScene("register",
    async (ctx) => {
        const user = await userModel.findOne({userid: ctx.chat.id})
        if(user) return ctx.scene.enter("homeScene")
        ctx.wizard.state.user = {};
        ctx.wizard.state.user.userid = ctx.chat.id;
        ctx.reply("Ismingizni kiriting")
        ctx.wizard.next()
    },

    async (ctx) => {
        if(ctx.message?.text == "/start") return ctx.scene.enter("start")
        ctx.wizard.state.user.firstname = ctx.message.text;
        ctx.reply("Familyangizni kiriting")
        ctx.wizard.next()
    },

    
    async (ctx) => {
        if(ctx.message?.text == "/start") return ctx.scene.enter("start")
        ctx.wizard.state.user.lastname = ctx.message.text;
        const newUser = await new userModel(ctx.wizard.state.user).save()
        newUser && ctx.scene.enter("homeScene");
    }
)


register.use((ctx, next) => {
    if(!ctx?.message?.text) return;
    next()
})

module.exports = register;