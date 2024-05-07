const { Scenes: { Stage } } = require("telegraf");
const bot = require("../index");

const stage = new Stage([
    require("./start.scene"),
    require("./auth.scene"),
    require("./home.scene"),
    require("./order.scene")
])


// stage.use((ctx, next) => {
//  ctx?.message?.text == "/start" ? bot.start(ctx => ctx.scene.enter("startScene")) : next()
// })


module.exports = stage;