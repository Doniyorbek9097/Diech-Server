const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")

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

const catalogModel = serverDB.model("Catalog", catalogSchema)

module.exports = catalogModel