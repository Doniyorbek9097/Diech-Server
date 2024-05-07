const { Scenes: {BaseScene, WizardScene}, Markup } = require("telegraf");
const startScene = new BaseScene('startScene');

startScene.enter((ctx) => ctx.scene.enter("homeScene"))

module.exports = startScene;
