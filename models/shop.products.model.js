const { Schema, model } = require("mongoose")

const reviewSchema = Schema(
    {
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
)


const shopProductsSchema = Schema({
    shop: {
        type: Schema.Types.ObjectId,
        ref: "Shop"
    },

    product: {
        type: Schema.Types.ObjectId,
        ref:"Product",
    },

    orginal_price: Number,
    sale_price: Number,
    inStock: Number,

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
        type: Number
    },

    attributes: [],
    variants: [{
        name: String,
        orginal_price: Number,
        sale_price: Number,
        inStock: {
            type: Number,
            default: 1
        },
        discount: Number,
        sku: String,

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

    }]
}, 

{
    timestamps: true,
    toJSON: { virtuals: true }
}
)

const shopProductModel = model("ShopProducts", shopProductsSchema);

module.exports = {
    shopProductModel
}