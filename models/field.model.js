const { Schema, default: mongoose } = require("mongoose")
const { serverDB } = require("../config/db")

const optionsSchema = Schema({
    value: {
        type: String,
        intl: true,
    }
},
{
    timestamps: true,
    toJSON: { virtuals: true }
})

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

    value: {
        type: String,
        intl: true
    },

    options: {
        type: [optionsSchema],
        default: undefined
    }
}, 

{
    timestamps: true,
    toJSON: { virtuals: true }
})


fieldSchema.virtual("category", {
    ref: "Category",
    localField: "_id",
    foreignField: "fields",
})


module.exports = serverDB.model('Field', fieldSchema)