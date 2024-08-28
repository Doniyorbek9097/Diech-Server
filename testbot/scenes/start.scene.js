const { Scenes:{BaseScene}, Markup } = require("telegraf");


const start = new BaseScene("start")

start.enter((ctx) => {
    ctx.session.history = []; 
    ctx.scene.enter("subscribeScene");
})

module.exports = start;