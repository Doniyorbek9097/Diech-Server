const { Schema, default: mongoose } = require("mongoose")
const { serverDB } = require("../config/db")


const fieldSchema = Schema({
    title: {
        uz: {
            type:String,
            default:""
        },
        ru: {
            type:String,
            default:""
        },
    },

    label: {
        uz: String,
        ru: String
    },
    
    values: {
        type: Array,
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