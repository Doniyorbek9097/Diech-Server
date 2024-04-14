const mongooose = require("mongoose");

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


module.exports = mongooose.model("Otp", Schema);