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
    product: {
        type: Schema.Types.ObjectId,
        ref: "ShopProducts",
        required: true
    },
    name: String,
    images: Array,
    orginal_price: Number,
    sale_price: Number,
    inStock: {
        type: Number,
        default: 1
    },
    discount: Number,
    sku: String,
    skuid: Number,
    attributes: [{
        option: {
            type: Schema.Types.ObjectId,
            ref: "Option"
        },
        value: {
            type: Schema.Types.ObjectId,
            ref: "OptionValues"
        },
        images: {
            type: Array,
            default: undefined
        }
    }],
    
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

})


const shopProductsSchema = Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
    },
    slug: String,
    discount: Number,
    orginal_price: Number,
    sale_price: Number,
    inStock: Number,
 
    categories: [{
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    }],

    brend: {
        type: Schema.Types.ObjectId,
        ref: "Brend"
    },

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

    attributes: {
        type: Array,
        default: undefined
    },

    variants: [variantsSchema]
},

    {
        timestamps: true,
        toJSON: { virtuals: true }
    }
)


const shopProductModel = model("ShopProducts", shopProductsSchema);

module.exports = {
    shopProductModel,
}