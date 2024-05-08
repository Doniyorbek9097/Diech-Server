const { Scenes: { BaseScene, WizardScene }, Markup } = require("telegraf");
const homeScene = new BaseScene('homeScene');
const { checkToken, startMiddleware } = require("../../middlewares/authBotMiddleware")

homeScene.enter( async (ctx) => {
   await ctx.replyWithHTML(`<i>👋Assalomu aleykum <b>${ctx.from.first_name}</b>\n\nsiz bu yerda buyurtmalar bilan ishlay olasiz!</i>\n`, {
        ...Markup.inlineKeyboard([
            [Markup.button.callback("🛒Barcha Buyurtmalar", "all-orders")],
            [
                Markup.button.callback("💰Hisobim", "all-orders"),
                Markup.button.callback("🛠️Sozlamalar", "all-orders")
            ],

        ]).resize()
    }).catch(err => {})

    await ctx.deleteMessage().catch(err => {})
})


homeScene.action("all-orders", ctx => ctx.scene.enter("orderScene"))

homeScene.use(checkToken)
homeScene.use(startMiddleware)

module.exports = homeScene;
