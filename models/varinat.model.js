const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")
const fileService = require("../services/file.service2")
const fileModel = require("../models/file.model")

const reviewSchema = require("./review.model")

const capitalize = (value) => {
    if (typeof value !== 'string') return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const attributesSchema = Schema({
    skuid: String,
    title: {
        type: String,
        intl: true,
        set: capitalize
    },
    name: {
        type: String,
        intl: true,
        set: capitalize
    },
    color: {
        type: String,
        default: undefined
    },

    images: [
        {
            image_id: {
                type: Schema.Types.ObjectId,
                ref: "File",
                required: true
            },
            small: {
                type: String,
                required: true
            },
            large: {
                type: String,
                required: true
            }
        }
    ],

},
    {
        toJSON: { virtuals: true },
        minimize: true
    })


const variantsSchema = Schema({
    attributes: [attributesSchema],
    product: { type: Schema.Types.ObjectId, ref: "ShopProducts", required: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop" },
    soldOut: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    returned: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    soldOutCount: { type: Number, default: 0 },
    returnedCount: { type: Number, default: 0 },
    inStock: { type: Number, default: 1 },
    name: String,
    slug: String,
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
        if (docs && docs.length) {
            for (const doc of docs) {
                // Har bir hujjatning attributes maydonidagi rasmlarni o'chirish
                for (const attr of doc.attributes) {
                    if (attr?.images?.length) {
                        for (const image of attr?.images) {
                            await fileService.remove(image.small);
                            await fileService.remove(image.large);
                            await fileModel.findByIdAndDelete(image.image_id);
                        }
                    }
                }
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


// variantsSchema.pre("insertMany", async function (next, docs) {
//     try {

//         // Asosiy hujjatlarni qayta ishlash
//         for (const doc of docs) {
//             // Har bir hujjat uchun atributlarni qayta ishlash
//             for (const attr of doc.attributes) {
//                 if (attr.images && attr.images.length) {
//                     // Rasmlarni yuklash va attr.images ni yangilash
//                     attr.images = await fileService.upload(attr.images);
//                 }
//             }
//         }
//         // Asinxron jarayonlar tugagandan keyin next() chaqiriladi
//         next();
//     } catch (err) {
//         // Xatolik yuz berganda, next() orqali xato uzatish
//         next(err);
//     }
// });




const variantModel = serverDB.model("Variant", variantsSchema)

module.exports = variantModel;