const mongoose = require("mongoose");
const { serverDB } = require("../config/db")

const addressSchema = mongoose.Schema({
    region: {
        type: String,
    },

    city: {
        type: String
    },

    district: {

    },

    street: {
        type: String
    },

    house: {
        type: String
    },

    location: {
        latitude: String,
        longitude: String
    }
}) 


const shopSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Do'kon nomi bo'lishi shart"],
    },

    point: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Point",
        required: [true, "Do'kon Point bo'lishi shart"],
    },

    slug: {
        type: String,
        required: true
    },

    publish: {
        type: Boolean,
        default: false
    },

    discription: {
        type: String,
    },

    image: {
        type: String,
        default: "https://thumbs.dreamstime.com/b/shop-building-colorful-isolated-white-33822015.jpg"
    },

    bannerImage: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/previews/006/828/785/original/paper-art-shopping-online-on-smartphone-and-new-buy-sale-promotion-pink-backgroud-for-banner-market-ecommerce-women-concept-free-vector.jpg"
    },

    isActive: {
        type: Boolean,
        default: false
    },

    address: addressSchema
},

{
    timestamps: true,
    toJSON: { virtuals: true }
}

);


shopSchema.virtual("employees", {
    "ref":"User",
    localField:"_id",
    foreignField:"shop"
})


shopSchema.virtual("products", {
    "ref": "ShopProducts",
    localField: "_id",
    foreignField: "shop"
});


shopSchema.virtual("orders", {
    "ref": "Order",
    localField: "_id",
    foreignField: "shop"
})



const shopModel = serverDB.model("Shop", shopSchema);
module.exports = shopModel


