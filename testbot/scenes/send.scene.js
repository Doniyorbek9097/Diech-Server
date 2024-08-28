const { Scenes: { WizardScene }, Markup } = require("telegraf");
const userModel = require("../models/user.model")

const sendScene = new WizardScene('sendScene',
    async (ctx) => {
        try {
            const text = `<b>Foydalanuvchilarga istalgan malumot habarlarni yuboring</b>`;
            const keyboard = Markup.keyboard([
                ["🔙 Bekor qilish"]
            ]).resize();
            await ctx.replyWithHTML(text, keyboard)
            ctx.wizard.next();
        } catch (error) {
            console.log(error)
        }
    },

    async (ctx) => {
        try {
            const users = await userModel.find({ isAdmin: false });
    
            users.forEach(item => {
                ctx.telegram.forwardMessage(item.userid, ctx.from.id, ctx.message.message_id, {
                    disable_notification: false
                })
                .catch(err => console.log(err.message));
            })

            await ctx.reply("Barchaga xabar yoborildi");
            return ctx.scene.enter("adminScene");
        } catch (error) {
            console.log(error)
        }
    },
)


sendScene.hears("🔙 Bekor qilish", (ctx) => ctx.scene.enter("adminScene"));

module.exports = sendScene;