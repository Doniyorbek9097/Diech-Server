const mongoose = require("mongoose");
const { serverDB } = require("../config/db")

const tokenSchema = mongoose.Schema({
    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    token: {
        type:String,
        index:true,
        unique:true,
        required:true
    },

    createdAt: { type: Date, default: Date.now, expires:3600 }
});


const tokenModel = serverDB.model("Token", tokenSchema);
module.exports = tokenModel
