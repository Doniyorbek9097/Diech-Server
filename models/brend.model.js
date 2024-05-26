const mongoose = require("mongoose");

const brendSchema = mongoose.Schema({
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


brendSchema.virtual("products", {
    "ref": "Product",
    localField: "_id",
    foreignField: "brend",
});

brendSchema.virtual("categories", {
    "ref": "Category",
    localField: "_id",
    foreignField: "brendId",
})

brendSchema.virtual("carousel", {
    ref: "Carousel",
    localField: "_id",
    foreignField: "brends",
})

module.exports = mongoose.model("Brend", brendSchema);