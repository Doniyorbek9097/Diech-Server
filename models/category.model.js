const { Schema, model } = require("mongoose");


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
    
    parent: {
        ref: "Category",
        type: Schema.Types.ObjectId,
    },

    fields: [{
        type: Schema.Types.ObjectId,
        ref:"Field"
    }],

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
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

categorySchema.virtual("image", {
    ref: "Banner",
    localField: "_id",
    foreignField: "category_image",
    justOne: true
})


categorySchema.virtual("shop_products", {
    ref: "ShopProducts",
    localField: "_id",
    foreignField: "categories",
})



// categorySchema.pre(['find'], function(next) {
//     this.populate("children");
//     this.populate("fields")
//     next();
// });



const categoryModel = model("Category", categorySchema);

module.exports = categoryModel