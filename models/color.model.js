const { Schema, model } = require("mongoose");

const colorSchema = Schema({
    name: {
        type: String,
        intl: true,
    },
    code:String,
},

{
    timestamps: true,
    toJSON: { virtuals: true }
}

)


module.exports = model("Color", colorSchema);