const mongoose = require("mongoose");
const { serverDB } = require("../config/db")

const brandSchema = mongoose.Schema({
    name: {
        type: String,
        default: ""
    },

    slug: {
        type: String,
        lowercase: true,
        default:""
    },

    title: {
        type: String,
        default:"",
        intl: true
    },

    image: {
        type: String,
        default:"",
        intl: true
    },

    logo: {
        type:String,
        default:""
    },

    discription: {
        type: String,
        default:"",
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