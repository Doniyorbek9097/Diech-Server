const {Schema} = require("mongoose")
const { serverDB } = require("../config/db")

const shopProductVariantModel = require("./shop.product.variant.model")
const reviewSchema = require("./review.model")

const capitalize = (value) => {
    if (typeof value !== 'string') return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

const attributesSchema = Schema({
    label: {
        type: String,
        intl: true,
        set: capitalize
    },
    value: {
        type: String, 
        intl: true,
        set: capitalize
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
    sku: String,
    attributes: [attributesSchema],
   
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