const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")
const fileService = require("../services/file.service2")

const fileSchema = Schema({
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
})


const fileModel = serverDB.model("File", fileSchema);

module.exports = fileModel;