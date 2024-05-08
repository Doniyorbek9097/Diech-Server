const { Scenes: { Stage } } = require("telegraf");
const bot = require("../index");

const stage = new Stage([
    require("./start.scene"),
    require("./auth.scene"),
    require("./home.scene"),
    require("./order.scene")
])


module.exports = stage;