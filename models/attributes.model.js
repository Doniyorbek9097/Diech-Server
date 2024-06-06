const { Schema, model } = require("mongoose")

const attributesChildSchema = Schema({
    value: {
        type: String,
        intl: true
    },
}, 
{toJSON: { virtuals: true }})

const attributesSchema = Schema({
    label: {
        type: String,
        intl: true
    },

    children: [attributesChildSchema]
}, 
{toJSON: { virtuals: true }})


const attributeModel =  model("Attribute", attributesSchema)

module.exports = {
    attributeModel
}