const { Scenes: { WizardScene } } = require("telegraf")
const userModel = require("../../models/user.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/generateToken")


const authScene = new WizardScene("authScene",
    (ctx) => {
        ctx.reply("Assalomu aleykum Ro'yxatdan o'tgan bo'lsangiz");
        ctx.reply("username nomingizni kiriting");
        ctx.wizard.next()
    },
    
   async (ctx) => {
        const text = ctx?.message?.text;
        if(!text) return;
        const user = await userModel.findOne({username: text});
        if(!user) return ctx.reply("Username xato");
        if(!user.verified) return ctx.reply("Username xato");
        if(user.role !== "deliverer") return ctx.reply("Siz Kureyur emassiz");
        ctx.wizard.state.username = user?.username;
        ctx.reply("parolingizni kiriting");
        ctx.wizard.next()
    },
    
    async (ctx) => {
        const text = ctx?.message?.text;
        if(!text) return;
        const user = await userModel.findOne({username: ctx.wizard.state?.username});
        const password = await bcrypt.compare(text, user?.password)
        if(!password) return ctx.reply("Parolingiz xato");
        user.telegramAccount = ctx.from;
        await user.save()
        ctx.session.user = user;
        ctx.session.token = await generateToken({
            _id: user._id,
            phone_number: user.phone_number,
            role: user.role,
        });

        ctx.scene.enter("homeScene")
        ctx.scene.leave();
    }

)


module.exports = authScene;
