const { Scenes: { WizardScene } } = require("telegraf")
const userModel = require("../../models/user.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/generateToken")
const { checkToken, startMiddleware } = require("../../middlewares/authBotMiddleware")


const authScene = new WizardScene("authScene",
   async (ctx) => {
       try {
        await ctx.reply("Assalomu aleykum Ro'yxatdan o'tgan bo'lsangiz\nusername nomingizni kiriting");
        await ctx.deleteMessage().catch(err => {})
        ctx.wizard.next()
       } catch (error) {
         console.log(error)
       }
        
    },
    
   async (ctx) => {
        try {
            const text = ctx?.message?.text;
        if(!text) return;
        const user = await userModel.findOne({username: text});
        if(!user) return await ctx.reply("Username xato");
        if(!user.verified) return await ctx.reply("Username xato");
        if(user.role !== "deliverer") return await ctx.reply("Siz Kureyur emassiz");
        ctx.wizard.state.username = user?.username;
        await ctx.reply("parolingizni kiriting");
        await ctx.deleteMessage().catch(err => {})
        ctx.wizard.next()
        } catch (error) {
            console.log(error)
        }
    },
    
    async (ctx) => {
        try {
            const text = ctx?.message?.text;
        if(!text) return;
        const user = await userModel.findOne({username: ctx.wizard.state?.username});
        const password = await bcrypt.compare(text, user?.password)
        if(!password) return await ctx.reply("Parolingiz xato");
        user.telegramAccount = ctx.from;
        await user.save()
        ctx.session.user = user;
        ctx.session.token = await generateToken({
            _id: user._id,
            phone_number: user.phone_number,
            role: user.role,
        });

        await ctx.scene.enter("homeScene")
        await ctx.deleteMessage().catch(err => {})
        } catch (error) {
            console.log(error)
        }
    }

)


authScene.use(startMiddleware)

module.exports = authScene;
