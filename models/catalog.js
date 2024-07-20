const { Schema, model } = require("mongoose")

const catalogSchema = Schema({
    title: {
        type: String,
        intl: true
    },

    images: [String],

    products: [{
        type: Schema.Types.ObjectId,
        ref:"Product"
    }]
},

{
    timestamps: true,
    toJSON: { virtuals: true }
}

)

const catalogModel = model("Catalog", catalogSchema)

module.exports = {
    catalogModel
}