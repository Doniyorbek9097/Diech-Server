const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")
const fileService = require("../services/file.service2")
const cron = require('node-cron');

const fileSchema = Schema({
    image_url:String,
    owner_id: String,
    owner_type: String,

    isActive: {
        type: Boolean,
        default: false
    },
},

{
    timestamps: true,
    minimize: true
})


const fileModel = serverDB.model("File", fileSchema);

module.exports = fileModel;