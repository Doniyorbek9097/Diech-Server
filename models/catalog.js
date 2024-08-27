const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")

const catalogSchema = Schema({
    title: {
        type: String,
        intl: true
    },

    bg_color: String,
    color: String,
    images: [String],

    products: [{
        type: Schema.Types.ObjectId,
        ref:"ShopProducts"
    }]
},

{
    timestamps: true,
    toJSON: { virtuals: true }
}

)

const catalogModel = serverDB.model("Catalog", catalogSchema)

module.exports = catalogModel