const { Schema, model, models } = require("mongoose");

const leftBannerSchema = Schema({
    image: {
        type: String,
        intl: true,
    },
    slug: {
        type: String
    }
},
{
    toJSON: { virtuals: true}
}
);


const topBannerSchema = Schema({
    image: {
        type: String,
        intl: true,
    },
    slug: {
        type: String
    }
},

{
    toJSON: { virtuals: true}
}

);



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

    left_banner: [leftBannerSchema],
    top_banner: [topBannerSchema],

    brendId: {
        type: Schema.Types.ObjectId,
        ref: 'Brend'
    },


    parent: {
        ref: "Category",
        type: Schema.Types.ObjectId,
    },


    children: [{
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }],


    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true }
    }

);




categorySchema.virtual("parentProducts", {
    ref: "Product",
    localField: "_id",
    foreignField: "parentCategory",
})


categorySchema.virtual("subProducts", {
    ref: "Product",
    localField: "_id",
    foreignField: "subCategory",
})


categorySchema.virtual("childProducts", {
    ref: "Product",
    localField: "_id",
    foreignField: "childCategory",
})



const categoryModel = model("Category", categorySchema);

module.exports = {
    categoryModel
}