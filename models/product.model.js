const { Schema, Types } = require("mongoose");
const { serverDB } = require("../config/db")
const fileService = require("../services/file.service")
const shopProductModel = require("./shop.product.model")

const attributesSchema = Schema({
    label: {
        type: String,
        intl: true,
        validate: {
            validator: function (value) {
                // Agar label object bo'lsa va {uz: "", ru: ""} ga teng bo'lsa, noto'g'ri qiymat qaytarish
                return !(typeof value === 'object' && value.uz === "" && value.ru === "");
            },
            message: props => `${props.value} label qabul qilinmaydi.`
        }
    },

    value: {
        type: String,
        intl: true,
        validate: {
            validator: function (value) {
                // Agar label object bo'lsa va {uz: "", ru: ""} ga teng bo'lsa, noto'g'ri qiymat qaytarish
                return !(typeof value === 'object' && value.uz === "" && value.ru === "");
            },
            message: props => `${props.value} label qabul qilinmaydi.`
        }
    },

}, { toJSON: { virtuals: true } })

const propertyOptionsSchema = Schema({
    key: {
        type: String,
        intl: true
    },
    value: {
        type: String,
        intl: true
    }
},
    { toJSON: { virtuals: true } }

)

const propertiesSchema = Schema({
    label: {
        type: String,
        intl: true
    },
    options: [propertyOptionsSchema]
},
    { toJSON: { virtuals: true } }
);



const productSchema = Schema({
    name: {
        type: String,
        intl: true,
        es_indexed: true
    },

    slug: {
        type: String,
        required: true
    },
    description: {
        type: String,
        intl: true,
    },

    images: [],
    newImages: [],
    properteis: [propertiesSchema],
    variantAttributes: {
        type: [Schema.Types.ObjectId],
        ref: "Attributes",
        default: undefined
    },

    categories: [{
        type: Schema.Types.ObjectId,
        ref: "Category"
    }],

    barcode: String,

    method_sale: {
        type: String,
        enum: ["piece", "weight"],
        default: "piece"
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

    brand: {
        type: Schema.Types.ObjectId,
        ref: "Brand",
    },


    attributes: {
        type: [attributesSchema],
        default: undefined,
        index: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    mixed: {
        type: Boolean,
        default: false
    },

    type: {
        type: String,
        enum: ["product"],
        default: "product"
    }
},

    {
        timestamps: true,
        toJSON: { virtuals: true },
        minimize: true
    }

);


productSchema.index({ 'slug': 1, 'name.uz': 'text', 'name.ru': 'text', 'barcode': 1 });

productSchema.virtual("variants", {
    ref: "Variant",
    localField: "_id",
    foreignField: "product_id"
})

productSchema.virtual("details", {
    ref: "ShopProducts",
    localField: "_id",
    foreignField: "product"
})



async function productUpdate(doc, next) {
    if (doc) {
        // Yangilangan hujjatni olish uchun qayta so'rov qilamiz
        const updatedDoc = await this.model.findOne(this.getQuery()).populate("variants");
        const variants = updatedDoc?.variants || [];
        if (updatedDoc) {
            const { _id, ...newData } = updatedDoc.toObject();

            // `shopProductModel` ni yangilash
            await shopProductModel.updateMany({ parent: _id }, { ...newData, variants });
        }
    }
    // `next()` chaqirilishi `updateMany` tugaganidan keyin
    next();
}

productSchema.post('findByIdAndUpdate', productUpdate)
productSchema.post('findOneAndUpdate', productUpdate)


const deleteProduct = async function (next) {
    try {
        // Query middlewarelar uchun: hujjatlarni topish
        const docs = await this.model.find(this.getQuery());

        // Topilgan hujjatlarni ko'rib chiqish
        if (Array.isArray(docs) && docs.length) {
            for (const doc of docs) {
                // Agar hujjatda rasmlar mavjud bo'lsa, o'chirish
                if (doc?.images?.length) {
                    await fileService.remove(doc.images);
                }

                // Bog'langan product va variantlarni o'chirish
                await shopProductModel.deleteMany({ parent: doc._id });
            }
        }

        // next funksiyasini chaqirish (xatolik bo'lmasa)
        next();
    } catch (err) {
        // Xatolikni next() orqali yuborish
        next(err);
    }
};

// Middlewarelarni ulash
// productSchema.pre('findOneAndDelete', deleteProduct);
// productSchema.pre('findByIdAndDelete', deleteProduct);
// productSchema.pre('deleteMany', deleteProduct);
// productSchema.pre('deleteOne', deleteProduct);
// productSchema.pre('remove', async function (next) {
//     try {
//         // Document context (this) bevosita hujjatni bildiradi
//         const doc = this;

//         // Agar hujjatda rasmlar mavjud bo'lsa, o'chirish
//         if (doc?.images?.length) {
//             await fileService.remove(doc.images);
//         }

//         // Bog'langan product va variantlarni o'chirish
//         await shopProductModel.deleteMany({ parent: doc._id });

//         next();
//     } catch (err) {
//         next(err);
//     }
// });




// Statik metodni qo'shish
productSchema.statics.getRandomProducts = async function ({ query = {}, limit = 10, page = 1, sort = {} }) {
    const skip = page * limit; // Sahifani o'tkazib yuborish uchun hisoblash

    // Aggregation pipeline
    const pipeline = [
        { $match: query }, // Qo'shimcha filtrlarni qo'llash
        { $sample: { size: limit } }, // Tasodifiy tartibda hujjatlarni olish
        { $skip: skip }, // Pagination uchun mahsulotlarni o'tkazib yuborish
        { $limit: limit }, // Sahifadagi mahsulotlar soni
        { $project: { _id: 1 } } // Faqat _id maydonini qaytarish
    ];

    // Agar sort parametri mavjud bo'lsa, pipeline ga qo'shamiz
    if (Object.keys(sort).length > 0) {
        pipeline.splice(2, 0, { $sort: sort }); // `$sample`dan keyin qo'shamiz
    }

    const products = await this.aggregate(pipeline);

    if (products.length) {
        return products.map(item => item._id); // Natijadagi hujjatlar _idlarini ajratib olish
    } else {
        return [];
    }
};


// productSchema.post('find', function(docs, next) {
//     // docs arrayini joyida tahrir qilamiz
//     for (let i = docs.length - 1; i >= 0; i--) {
//         const doc = docs[i];
//         if (!doc.details || !doc.details.length) {
//             docs.splice(i, 1); // Agar details bo'sh bo'lsa, hujjatni arraydan o'chirib tashlaymiz
//             docs.sort(() => Math.random() - 0.5);
//         } else {
//             // details ichidagi mahsulotlarni sale_price bo'yicha sortlaymiz
//             doc.details.sort((a, b) => a.sale_price - b.sale_price);
//         }
//     }
// });

// productSchema.post('findOne', function(doc, next) {
//     if (doc) {
//         // `details` maydoni mavjudligini va bo'sh emasligini tekshiramiz
//         if (doc.details && doc.details.length) {
//             // `details` ichidagi mahsulotlarni `sale_price` bo'yicha sortlaymiz
//             doc.details.sort((a, b) => a.sale_price - b.sale_price);
//         }

//         next()

//     }
// });






const productModel = serverDB.model("Product", productSchema);

module.exports = productModel


