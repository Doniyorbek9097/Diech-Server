const mongooose = require("mongoose");
const { serverDB } = require("../config/db")

const Schema = mongooose.Schema({
    otp: {
        type:String,
        required:true
    },

    phone_number: {
        type:String,
        required:true
    },

    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires:3600 
    }

},{timestamps:true});

const otpModel = serverDB.model("Otp", Schema);
module.exports = otpModel