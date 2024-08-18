const { testbotDB } = require("../config/mongoDB")
const { Schema } = require("mongoose")

const answerSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "TestBotUser"
    },
    tgid: String,
    ball: Number,
    status: String,
    found: String,
    correctAnswerCount: Number,
    wrongAnswerCount: Number,
    date: String
})

const testSchema = Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "TestBotUser"
    },
    answers: [answerSchema],
    name: String,
    keyword: String,
    keyboards: [{
        type: String,
        default: undefined
    }],
    code: Number,
    date: String,
    closed: {
        type: Boolean,
        default: false
    },
},
    {
        toJSON: { virtuals: true }
    }
)

module.exports = testbotDB.model("Test", testSchema)