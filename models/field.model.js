const { Schema, model } = require("mongoose")

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

module.exports = model('Field', fieldSchema)