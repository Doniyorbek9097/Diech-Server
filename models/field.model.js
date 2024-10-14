const { Schema, default: mongoose } = require("mongoose")
const { serverDB } = require("../config/db")


const fieldSchema = Schema({
    category_id: {
        type: Schema.Types.ObjectId,
        ref:"Category"
    },

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
    
    type: {
        type: String,
        enum:['select','input'],
        default: "input"
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