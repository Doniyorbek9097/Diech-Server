const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")
const fileService = require("../services/file.service2")
const cron = require('node-cron');

const fileSchema = Schema({
    image_url:String,
    owner_id: String,
    owner_type: String,
    
    image: {
        small: String,
        large: String
    },

    isActive: {
        type: Boolean,
        default: false
    },

    product_id: {
        type: Schema.Types.ObjectId,
        ref:"product"
    }
},
{
    timestamps: true,
    minimize: true
})


const fileModel = serverDB.model("File", fileSchema);

module.exports = fileModel;