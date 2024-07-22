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


const variantsSchema = Schema({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    shopDetail: {type: Schema.Types.ObjectId, ref:"ShopProducts", required: true},
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
})

const shopVariantModel = model("ShopVariant", variantsSchema)

const shopProductsSchema = Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
    },
    // slug: String,
    discount: Number,
    orginal_price: Number,
    sale_price: Number,
    inStock: Number,
    shop: {
        type: Schema.Types.ObjectId,
        ref: "Shop"
    },

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
},

    {
        timestamps: true,
        toJSON: { virtuals: true }
    }
)


shopProductsSchema.virtual("variants", {
    ref: "ShopVariant",
    localField: "_id",
    foreignField: "shopDetail"
})

const shopProductModel = model("ShopProducts", shopProductsSchema);

module.exports = {
    shopProductModel,
    shopVariantModel
}