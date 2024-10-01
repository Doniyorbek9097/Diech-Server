const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")
const fileService = require("../services/file.service")

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
    attributes: [attributesSchema],
    product: {type: Schema.Types.ObjectId, ref:"ShopProducts", required: true},
    shop: { type: Schema.Types.ObjectId, ref:"Shop" },
    soldOut: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    returned: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    soldOutCount: { type: Number, default: 0},
    returnedCount: {type: Number, default: 0},
    inStock: { type: Number, default: 1},
    name:String,
    slug:String,
    image:String,
    orginal_price: Number,
    sale_price: Number,
    discount: Number,
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