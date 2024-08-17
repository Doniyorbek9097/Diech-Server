const { Schema, model } = require("mongoose")

const userSchema = new Schema({
    userid: String,
    firstname: String,
    lastname: String,
    template: {
        type:"String",
        enum:["image-1.png", "image-2.png", "image-3.png", "image-4.png"],
        default: "image-1.png"
    },
    certificates: [{
        type: Schema.Types.ObjectId,
        default: undefined
    }]
})


module.exports = model("TestBotUser", userSchema)