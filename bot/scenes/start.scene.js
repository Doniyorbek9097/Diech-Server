const { Scenes: {BaseScene, WizardScene}, Markup } = require("telegraf");
const startScene = new BaseScene('startScene');
const { checkToken, startMiddleware } = require("../../middlewares/authBotMiddleware")

startScene.enter((ctx) => ctx.scene.enter("homeScene"))


module.exports = startScene;
