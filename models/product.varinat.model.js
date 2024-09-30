const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")
const fileService = require("../services/file.service")

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

}, { toJSON: { virtuals: true } })


const variantsSchema = Schema({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    sku: String,
    attributes: [attributesSchema],

})



const deleteShopVariants = async function (next) {
    try {
        // Hujjatlarni o'chirishdan oldin topish
        const docs = await this.model.find(this.getQuery());
        
        // Agar topilgan hujjatlar bo'lsa
        if (Array.isArray(docs) && docs.length) {
            for (const doc of docs) {
                // Har bir hujjatning attributes maydonidagi rasmlarni o'chirish
                for (const attr of doc.attributes) {
                    if (attr?.images?.length) {
                        await fileService.remove(attr.images);
                    }
                }
                // Tegishli variantlarni o'chirish
                await shopProductVariantModel.deleteMany({ variant: doc._id });
            }
        }

        // Xatolik bo'lmasa, next() chaqiriladi
        next();
    } catch (err) {
        // Xatolik bo'lsa, xatoni next() orqali yuborish
        next(err);
    }
};

// Middleware o'rnatish
variantsSchema.pre('findOneAndDelete', deleteShopVariants);
variantsSchema.pre('findByIdAndDelete', deleteShopVariants);
variantsSchema.pre('deleteMany', deleteShopVariants);
variantsSchema.pre('deleteOne', deleteShopVariants);


const variantModel = serverDB.model("Variant", variantsSchema)

module.exports = variantModel;