const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")

const fieldSchema = Schema({
    category_id: {
        type: Schema.Types.ObjectId,
        ref:"Category"
    },

    label: {
        uz: String,
        ru: String
    },
    
    type: {
        type: String,
        enum:['select','checkbox','radio','input'],
        default: "input"
    },

    values: [{
        uz: String,
        ru: String
    }]
})


fieldSchema.virtual("category", {
    ref: "Category",
    localField: "_id",
    foreignField: "fields",
})


module.exports = serverDB.model('Field', fieldSchema)