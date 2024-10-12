const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")
const variantModel = require("./varinat.model")


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

    type: {
        type: String
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

    values: [{
        type: Schema.Types.Mixed,
        intl: true,
        default: undefined
    }]

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


const keywordsSchema = Schema({
    uz: Array,
    ru: Array
},

    { toJSON: { virtuals: true } })


const shopProductsSchema = Schema({
    parent: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    shop: {
        type: Schema.Types.ObjectId,
        ref: "Shop",
        required: true
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    name: {
        type: String,
        intl: true,
        required: true
    },

    orginal_price: {
        type: Number,
        required: true
    },

    sale_price: {
        type: Number,
        required: true
    },

    inStock: {
        type: Number,
        required: true
    },


    slug: {
        type: String,
        index: true,
        required: true
    },
    description: {
        type: String,
        intl: true,
        required: true
    },

    images: [
        {
            _id: {  // yoki id deb ham nomlashingiz mumkin
                type: Schema.Types.ObjectId,
                ref: "File",
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],

    properteis: {
        type: [propertiesSchema],
    },

    categories: [{
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    }],

    keywords: keywordsSchema,
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
        default: 0,
    },

    reviewsCount: {
        type: Number,
        default: 0
    },

    discount: {
        type: Number,
        default: 0
    },


    brend: {
        type: Schema.Types.ObjectId,
        ref: "Brend",
    },


    attributes: {
        type:[attributesSchema],
        default: undefined,
        index: true
    },
    position: Number,

},

    {
        timestamps: true,
        toJSON: { virtuals: true },
        minimize: true
    }
)

shopProductsSchema.index({ slug: 1 });


shopProductsSchema.virtual("variants", {
    ref: "Variant",
    localField: "_id",
    foreignField: "product"
})


// Statik metodni qo'shish
shopProductsSchema.statics.getRandomProducts = async function ({ query = {}, limit = 10, page = 1, sort = {} }) {
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



const deleteShopVariants = async function (next) {
    try {
        const doc = await this.model.findOne(this.getFilter());

        if (doc) {
            await variantModel.deleteMany({ product: doc._id })
        }
        next();
    } catch (err) {
        next(err);
    }
};



// `insertMany` chaqirilganda mahsulotlarga tasodifiy `position` qiymati beriladi
shopProductsSchema.pre("insertMany", function (next, docs) {
    docs.forEach((doc) => {
        // Agar mahsulotda `position` maydoni bo'lmasa, tasodifiy raqam beriladi
        if (!doc.position) {
            doc.position = Math.floor(Math.random() * 1000);
        }
    });
    next();
});


shopProductsSchema.pre('findOneAndDelete', deleteShopVariants);
shopProductsSchema.pre('findByIdAndDelete', deleteShopVariants);
shopProductsSchema.pre('deleteMany', deleteShopVariants);
shopProductsSchema.pre('deleteOne', deleteShopVariants);
shopProductsSchema.pre('remove', deleteShopVariants);


shopProductsSchema.virtual("reviews", {
    ref: "Reviews",
    localField: "_id",
    foreignField: "product_id"
})


const shopProductModel = serverDB.model("ShopProducts", shopProductsSchema);

module.exports = shopProductModel