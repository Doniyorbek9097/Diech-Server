const { Scenes:{Stage} } = require("telegraf");

const stage = new Stage([
    require("./start.scene"),
    require("./register.scene"),
    require("./home.scene"),
    
    require("./question/menu"),
    require("./question/simple"),
    require("./question/subject"),
    require("./question/special"),
    require("./question/multiple"),

    require("./answer/main"),
    require("./answer/simple"),
    require("./answer/subject"),
    require("./answer/special"),
    require("./answer/multiple"),

    require("./certificate.scene"),
    require("./settings.scene"),
    require("./templates.scene"),
    







])

module.exports = stage;