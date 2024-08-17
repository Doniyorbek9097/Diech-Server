const { Schema, model } = require("mongoose")

const answerSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "TestBotUser"
    },

    ball: {
        type: Number,
        default: 0
    }
})

const testSchema = Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "TestBotUser"
    },
    answers: [answerSchema],
    name:String,
    keyword: String,
    keyboards:[{
        type: String,
        default: undefined
    }],
    code: Number,
    closed: {
        type: Boolean,
        default: false
    }
},

{
    timestamps: true,
    toJSON: { virtuals: true }
}
)

module.exports = model("Test", testSchema)