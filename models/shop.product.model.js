const { Schema, model } = require("mongoose")
const shopProductVariantModel = require("./shop.product.variant.model")
const reviewSchema = require("./review.model")


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


const deleteShopVariants = async function(next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            await shopProductVariantModel.deleteMany({shopDetail: doc._id});
        }
        next();
    } catch (err) {
        next(err);
    }
};


shopProductsSchema.pre('findOneAndDelete', deleteShopVariants);
shopProductsSchema.pre('findByIdAndDelete', deleteShopVariants);
shopProductsSchema.pre('deleteMany', deleteShopVariants);
shopProductsSchema.pre('deleteOne', deleteShopVariants);
shopProductsSchema.pre('remove', deleteShopVariants);






const shopProductModel = model("ShopProducts", shopProductsSchema);

module.exports = shopProductModel