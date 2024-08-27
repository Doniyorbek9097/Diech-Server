const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")

const shopProductVariantModel = require("./shop.product.variant.model")
const reviewSchema = require("./review.model")

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



const shopProductsSchema = Schema({
    parent: {
        type: Schema.Types.ObjectId,
        ref: "Product",
    },

    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
    }, 

    slug: String,
    categories: [{
        type: Schema.Types.ObjectId,
        ref: "Category"
    }],
    name: {
        type:String,
        intl:true
    },
    
    description: {
        type: String,
        intl: true
    },
    exactname: {
        type: String,
        intl: true
    },
    method_sale: {
        type: String,
        enum:["piece", "weight"],
        default: "piece"
    },
    images: [],
    properteis: [propertiesSchema],

    

    barcode:String,
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

    owner: {
        type:Schema.Types.ObjectId,
        ref:"User"
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