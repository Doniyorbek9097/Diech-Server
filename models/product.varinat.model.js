const {Schema} = require("mongoose")
const { serverDB } = require("../config/db")

const shopProductVariantModel = require("./shop.product.variant.model")
const reviewSchema = require("./review.model")


const attributesSchema = Schema({
    label: {
        type: String,
        intl: true 
    },
    value: {
        type: String, 
        intl: true
    },
    images: {
        type: Array,
        default: undefined
    },

}, {  toJSON: { virtuals: true } })


const variantsSchema = Schema({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    slug: String,
    sku: String,
    product_name: String,
    attributes: [attributesSchema],
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


    returnedCount: {
        type: Number,
        default: 0
    },
})



const deleteShopVariants = async function(next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            await shopProductVariantModel.deleteMany({ variant: doc._id });
        }
        next();
    } catch (err) {
        next(err);
    }
};


variantsSchema.pre('findOneAndDelete', deleteShopVariants);
variantsSchema.pre('findByIdAndDelete', deleteShopVariants);
variantsSchema.pre('deleteMany', deleteShopVariants);
variantsSchema.pre('deleteOne', deleteShopVariants);
variantsSchema.pre('remove', deleteShopVariants);


const variantModel = serverDB.model("Variant", variantsSchema)

module.exports = variantModel;