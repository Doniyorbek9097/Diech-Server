const { Scenes:{Stage} } = require("telegraf");

const stage = new Stage([
    require("./start.scene"),
    require("./register.scene"),
    require("./home.scene"),
    require("./create-test/createTestMenu.scene"),
    require("./create-test/simple.scene"),
    require("./create-test/subject.scene"),
    require("./create-test/special.scene"),
    require("../scenes/create-test/block.scene"),
    require("./answer.scene"),
    require("./certificate.scene"),
    require("./settings.scene"),
    require("./templates.scene"),
    







])

module.exports = stage;