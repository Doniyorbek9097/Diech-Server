const { Schema } = require("mongoose");
const { serverDB } = require("../config/db")
const shopProductModel = require("./shop.product.model")

const categorySchema = new Schema({
    name: {
        type: String,
        intl: true
    },
    slug: {
        type: String,
        unique: true
    },

    icon: String,
    image: String,
    
    parent: {
        ref: "Category",
        type: Schema.Types.ObjectId,
    },

    fields: [{
        type: Schema.Types.ObjectId,
        ref:"Field",
        default: undefined
    }],

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    showHomePage: {
        type: Boolean,
        default: false
    },

    type: {
        type:String,
        enum:["category"],
        default:"category"
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true }
    }

);


categorySchema.virtual("children", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent",
})


categorySchema.virtual("products", {
    ref: "Product",
    localField: "_id",
    foreignField: "categories",
})

categorySchema.virtual("banners", {
    ref: "Banner",
    localField: "_id",
    foreignField: "category_banner",
})


categorySchema.virtual("shop_products", {
    ref: "ShopProducts",
    localField: "_id",
    foreignField: "categories",
})


// Statik metodni qo'shish
categorySchema.statics.getRandomProducts = async function({query = {}, limit = 10, page = 1, sort = {}}) {
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

    const products = await shopProductModel.aggregate(pipeline);

    if (products.length) {
        return products.map(item => item._id); // Natijadagi hujjatlar _idlarini ajratib olish
    } else {
        return [];
    }
};



// Statik metodni qo'shish
categorySchema.statics.getRandomCategories = async function({query = {}, limit = 10, page = 1, sort = {}, fields = {}}) {
    const skip = page * limit; // Sahifani o'tkazib yuborish uchun hisoblash

    // Aggregation pipeline
    const pipeline = [
        { $match: query }, // Qo'shimcha filtrlarni qo'llash
        { $sample: { size: limit } }, // Tasodifiy tartibda hujjatlarni olish
        { $skip: skip }, // Pagination uchun mahsulotlarni o'tkazib yuborish
        { $limit: limit }, // Sahifadagi mahsulotlar soni
        { $project: { _id: 1, ...fields } } // Faqat _id maydonini qaytarish
    ];

    // Agar sort parametri mavjud bo'lsa, pipeline ga qo'shamiz
    if (Object.keys(sort).length > 0) {
        pipeline.splice(2, 0, { $sort: sort }); // `$sample`dan keyin qo'shamiz
    }

    const categories = await this.aggregate(pipeline);

    if (categories.length) {
        return categories // Natijadagi hujjatlar _idlarini ajratib olish
    } else {
        return [];
    }
};


// categorySchema.pre(['find'], function(next) {
//     this.populate("children");
//     this.populate("fields")
//     next();
// });



const categoryModel = serverDB.model("Category", categorySchema);

module.exports = categoryModel