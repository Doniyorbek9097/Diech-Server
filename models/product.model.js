const { Schema, model } = require("mongoose");
const { shopProductModel } = require("./shop.products.model")

const reviewSchema = Schema(
    {
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
)


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
{  toJSON: { virtuals: true } }

)


const propertiesSchema = Schema({
    label: {
        type: String,
        intl: true
    },
    options: [propertyOptionsSchema]
},
{  toJSON: { virtuals: true } }
);


const attributesSchema = Schema({
    option: {
        type: Schema.Types.ObjectId,
        ref: "Option"
    },
    options: [{
        option: {
            type: Schema.Types.ObjectId,
            ref: "OptionValues"
        },
        images: {
            type: Array,
            default: undefined
        }
    }],

    product_id: {
        type: Schema.Types.ObjectId,
        ref: "Product"
    }
})


const attributeModel = model("Attribute", attributesSchema)


const productSchema = Schema({
    name: {
        type: String,
        intl: true
    },

    slug: {
        type: String,
        required: true
    },

    discription: {
        type: String,
        intl: true
    },

    images: [],

    properteis: [propertiesSchema],

    categories: [{
        type: Schema.Types.ObjectId,
        ref: "Category"
    }],

    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },

    subCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },

    childCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },


    brend: {
        type: Schema.Types.ObjectId,
        ref: "Brend",
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

    discount: {
        type: Number
    },


    returnedCount: {
        type: Number,
        default: 0
    },

    type: {
        type: String,
        enum: ["product"],
        default: "product"
    }
},

    {
        timestamps: true,
        toJSON: { virtuals: true }
    }

);

productSchema.virtual("attributes", {
    ref: "Attribute",
    localField: "_id",
    foreignField: "product_id"
})




const deleteShopProducts = async function(next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            await shopProductModel.deleteMany({ product: doc._id });
        }
        next();
    } catch (err) {
        next(err);
    }
};

productSchema.pre('findOneAndDelete', deleteShopProducts);
productSchema.pre('findByIdAndDelete', deleteShopProducts);



const productModel = model("Product", productSchema);
module.exports = {
    attributeModel,
    productModel,
}

