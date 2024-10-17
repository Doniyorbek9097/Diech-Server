const mongoose = require("mongoose");
const { serverDB } = require("../config/db");

const brandSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    slug: {
        type: String,
        lowercase: true,
    },

    title: {
        type: String,
        intl: true,
        required: true,
        trim: true,
    },

    image: {
        type: String,
        intl: true
    },

    logo: {
        type:String,
        required: true
    },

    description: {
        type: String,
        intl: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, 

{
    timestamps: true,
    toJSON: { virtuals: true }
}

);


brandSchema.virtual("products", {
    "ref": "ShopProducts",
    localField: "_id",
    foreignField: "brend",
});

brandSchema.virtual("categories", {
    "ref": "Category",
    localField: "_id",
    foreignField: "brendId",
})

brandSchema.virtual("carousel", {
    ref: "Carousel",
    localField: "_id",
    foreignField: "brends",
})

const brandModel = serverDB.model("Brend", brandSchema);

module.exports = brandModel