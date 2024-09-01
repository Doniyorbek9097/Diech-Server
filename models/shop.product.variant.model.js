const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")

const reviewSchema = require("./review.model")

const variantsSchema = Schema({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    shopProduct: {type: Schema.Types.ObjectId, ref:"ShopProducts", required: true},
    variant: { type: Schema.Types.ObjectId, ref:"Variant"},
    shop: { type: Schema.Types.ObjectId, ref:"Shop" },
    soldOut: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    returned: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    soldOutCount: { type: Number, default: 0},
    returnedCount: {type: Number, default: 0},
    inStock: { type: Number, default: 1},
    orginal_price: Number,
    sale_price: Number,
    discount: Number,
    sku: String,
    reviews: {
        type: [reviewSchema]
    },

    views: {
        type: [Schema.Types.ObjectId],
        ref: "User"
    },

    viewsCount: {
        type: Number,
        default: 0
    },

    soldOut: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],

    soldOutCount: {
        type: Number,
        default: 0
    },

    returned: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],

    returnedCount: {
        type: Number,
        default: 0
    },

    rating: {
        type: Number,
        required: true,
        default: 0,
    },

    discount: {
        type: Number,
        default: 1
    },
})

const shopProductVariantModel = serverDB.model("ShopVariant", variantsSchema)

module.exports = shopProductVariantModel;