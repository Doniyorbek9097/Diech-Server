const { Schema, model, models } = require("mongoose");


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


    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    type: {
        type: String,
        enum: ["category"],
        default: "category"
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

categorySchema.pre(['find','findOne','findById'], function(next) {
    this.populate("children");
    next();
});


const categoryModel = model("Category", categorySchema);

module.exports = {
    categoryModel
}