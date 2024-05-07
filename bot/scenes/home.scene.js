const { Scenes: { BaseScene, WizardScene }, Markup } = require("telegraf");
const homeScene = new BaseScene('homeScene');
const { checkToken } = require("../../middlewares/authBotMiddleware")

homeScene.enter((ctx) => {
    ctx.reply("Home page", {
        ...Markup.keyboard([
            ["Barcha buyurtmalar"],
            ["Sozlamalar"]

        ]).resize()
    });
})


homeScene.hears("Barcha buyurtmalar", ctx => ctx.scene.enter("orderScene"))

// homeScene.use(checkToken)
module.exports = homeScene;
