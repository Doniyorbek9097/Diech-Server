const mongooose = require("mongoose");

const colorSchema = mongooose.Schema({
    name: {
        type: String,
        intl: true
    },

    image: {
        type:Array,
        default:[]
    }
});


module.exports = mongooose.model("Color", colorSchema);