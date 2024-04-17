const mongoose = require("mongoose");

const shopSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Do'kon nomi bo'lishi shart"],
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

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },


    isActive: {
        type: Boolean,
        default: false
    }

},

{
    timestamps: true,
    toJSON: { virtuals: true }
}

);



shopSchema.virtual("products", {
    "ref": "Product",
    localField: "_id",
    foreignField: "shop"
})




module.exports = mongoose.model("Shop", shopSchema);

