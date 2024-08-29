const { Scenes:{BaseScene}, Markup } = require("telegraf");


const startScene = new BaseScene("startScene")

startScene.enter((ctx) => {
    ctx.session.history = []; 
    ctx.scene.enter("subscribeScene");
})

module.exports = startScene;