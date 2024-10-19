const mongoose = require("mongoose");
const { testbotDB } = require("../config/mongoDB")

const ChannelSchema = mongoose.Schema({
    username:{
        type:String,
    },
});

module.exports = testbotDB.model("Channels", ChannelSchema);