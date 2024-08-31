const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")

const shopProductVariantModel = require("./shop.product.variant.model")
const reviewSchema = require("./review.model")
const { count } = require("console")


const attributesSchema = Schema({
    label: {
        type: String,
        intl: true,
        validate: {
            validator: function(value) {
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
            validator: function(value) {
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
        type:Schema.Types.ObjectId,
        ref:"User",
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
        required: true
    },
    description: {
        type: String,
        intl: true,
        required: true
    },

    images: [],
    properteis: [propertiesSchema],

    categories: [{
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    }],

    keywords: keywordsSchema,
    barcode: String,

    method_sale: {
        type: String,
        enum:["piece", "weight"],
        default: "piece"
    },

    reviews: {
        type: [reviewSchema],
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

    brend: {
        type: Schema.Types.ObjectId,
        ref: "Brend",
    },


    attributes: [attributesSchema],

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


// Statik metodni qo'shish
shopProductsSchema.statics.getRandomProducts = async function({query = {}, limit = 10, page = 1, sort = {}}) {
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






const shopProductModel = serverDB.model("ShopProducts", shopProductsSchema);

module.exports = shopProductModel