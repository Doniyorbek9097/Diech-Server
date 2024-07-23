const { Schema, model } = require("mongoose");
const { shopProductModel, shopVariantModel } = require("./shop.products.model")

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
    label: {
        type: String,
        intl: true 
    },
    value: {
        type: String, 
        intl: true
    },
    images: {
        type: Array,
        default: undefined
    },

}, {  toJSON: { virtuals: true } })


const variantsSchema = Schema({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    slug: String,
    sku: String,
    product_name: String,
    attributes: [attributesSchema],
})



const deleteShopVariants = async function(next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            await shopVariantModel.deleteMany({ variant: doc._id });
        }
        next();
    } catch (err) {
        next(err);
    }
};


variantsSchema.pre('findOneAndDelete', deleteShopVariants);
variantsSchema.pre('findByIdAndDelete', deleteShopVariants);
variantsSchema.pre('deleteMany', deleteShopVariants);
variantsSchema.pre('deleteOne', deleteShopVariants);
variantsSchema.pre('remove', deleteShopVariants);


const variantModel = model("Variant", variantsSchema)


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
    
    keywords: [],
    barcode: String,

    method_sale: {
        type: Boolean,
        default: false
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

productSchema.virtual("variants", {
    ref: "Variant",
    localField: "_id",
    foreignField: "product_id"
})

productSchema.virtual("details", {
    ref:"ShopProducts",
    localField: "_id",
    foreignField: "product"
})



const deleteDetails = async function(next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            await shopProductModel.deleteMany({ product: doc._id });
            await variantModel.deleteMany({product_id: doc._id});
        }
        next();
    } catch (err) {
        next(err);
    }
};


productSchema.pre('findOneAndDelete', deleteDetails);
productSchema.pre('findByIdAndDelete', deleteDetails);
productSchema.pre('deleteMany', deleteDetails);
productSchema.pre('deleteOne', deleteDetails);
productSchema.pre('remove', deleteDetails);

const productModel = model("Product", productSchema);
module.exports = {
    variantModel,
    productModel,
}

