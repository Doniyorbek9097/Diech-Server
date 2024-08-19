const { Schema } = require("mongoose");
const { serverDB } = require("../config/db")


const shopProductModel = require("./shop.product.model")
const productVariantModel = require("./product.varinat.model")
const reviewSchema = require("./review.model")

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
    { toJSON: { virtuals: true } }

)


const attributesSchema = Schema({
    label: {
        type: String,
        intl: true,
        validate: {
            validator: function(value) {
              // Agar label object bo'lsa va {uz: "", ru: ""} ga teng bo'lsa, noto'g'ri qiymat qaytarish
              return !(typeof value === 'object' && value.uz === "" && value.ru === "");
            },
            message: props => `${props.value} label qabul qilinmaydi.`
          }
    },

    type: {
        type: String
    },

    value: {
        type: String,
        intl: true,
        validate: {
            validator: function(value) {
              // Agar label object bo'lsa va {uz: "", ru: ""} ga teng bo'lsa, noto'g'ri qiymat qaytarish
              return !(typeof value === 'object' && value.uz === "" && value.ru === "");
            },
            message: props => `${props.value} label qabul qilinmaydi.`
          }
    },

    values: [{
        type: Schema.Types.Mixed,
        intl: true,
        default: undefined
      }]
    
}, { toJSON: { virtuals: true } })


const propertiesSchema = Schema({
    label: {
        type: String,
        intl: true
    },
    options: [propertyOptionsSchema]
},
    { toJSON: { virtuals: true } }
);


const keywordsSchema = Schema({
    uz: Array,
    ru: Array
},

{ toJSON: { virtuals: true } })


const productSchema = Schema({
    name: {
        type: String,
        intl: true,
        es_indexed: true
    },

    slug: {
        type: String,
        required: true
    },

    discription: {
        type: String,
        intl: true,
        es_indexed: true

    },

    images: [],
    properteis: [propertiesSchema],

    categories: [{
        type: Schema.Types.ObjectId,
        ref: "Category"
    }],

    keywords: keywordsSchema,
    // keywords: [{
    //     type: Schema.Types.Mixed,
    //     intl: true,
    //     default: undefined
    // }],


    barcode: String,

    method_sale: {
        type: Boolean,
        default: false
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

    brend: {
        type: Schema.Types.ObjectId,
        ref: "Brend",
    },

    weight: {
        type: Boolean,
        default: false
    },

    attributes: [attributesSchema],
    owner: {
        type:Schema.Types.ObjectId,
        ref:"User"
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
    ref: "ShopProducts",
    localField: "_id",
    foreignField: "product"
})



const deleteDetails = async function (next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            await shopProductModel.deleteMany({ product: doc._id });
            await productVariantModel.deleteMany({ product_id: doc._id });
        }
        next();
    } catch (err) {
        next(err);
    }
};


productSchema.statics.getRandomProducts = async function(limit) {
    return this.aggregate([
        { $sample: { size: limit } } // Barcha hujjatlarni randomlashtiradi va `limit` miqdorida hujjatlarni oladi
    ]);
};


productSchema.post('find', function(docs) {
    // docs arrayini joyida tahrir qilamiz
    for (let i = docs.length - 1; i >= 0; i--) {
        const doc = docs[i];
        if (!doc.details || !doc.details.length) {
            docs.splice(i, 1); // Agar details bo'sh bo'lsa, hujjatni arraydan o'chirib tashlaymiz
            docs.sort(() => Math.random() - 0.5);
        } else {
            // details ichidagi mahsulotlarni sale_price bo'yicha sortlaymiz
            doc.details.sort((a, b) => a.sale_price - b.sale_price);
        }
    }
});

productSchema.post('findOne', function(doc) {
    if (doc) {
        // `details` maydoni mavjudligini va bo'sh emasligini tekshiramiz
        if (doc.details && doc.details.length) {
            // `details` ichidagi mahsulotlarni `sale_price` bo'yicha sortlaymiz
            doc.details.sort((a, b) => a.sale_price - b.sale_price);
        }
    }
});


productSchema.pre('findOneAndDelete', deleteDetails);
productSchema.pre('findByIdAndDelete', deleteDetails);
productSchema.pre('deleteMany', deleteDetails);
productSchema.pre('deleteOne', deleteDetails);
productSchema.pre('remove', deleteDetails);



const productModel = serverDB.model("Product", productSchema);

module.exports = productModel


