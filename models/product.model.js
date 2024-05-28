const { Schema, model } = require("mongoose");

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



const propertiesSchema = Schema({
    key: {
        type: String,
        intl: true
    },
    value: {
        type: String,
        intl: true
    }
},

    {
        toJSON: { virtuals: true }
    }

);



const optionSchema = Schema({
    name: {
        type: String,
    },

    type: {
        type: String,
    },

    values: [String]

})

const productOptionModel = model("ProductOption", optionSchema);





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
    quantity: {
        type: Number,
        default: 1
    },
    orginal_price: { type: Number, min: 0 },
    sale_price: { type: Number, min: 0 },

    properteis: [propertiesSchema],

    active: {
        type: Boolean,
        default: false
    },

    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        // required:true
    },

    subCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        // required:true
    },

    childCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        // required:true
    },

    country: {
        type: String,
        default: ""
    },

    brend: {
        type: Schema.Types.ObjectId,
        ref: "Brend"
    },

    shop: {
        type: Schema.Types.ObjectId,
        ref: "Shop"
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"

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

    attributes: [],
    variants: [{
        name: String,
        orginal_price: Number,
        sale_price: Number,
        quantity: {
            type: Number,
            default: 1
        },
        discount: Number,
        sku: String,

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

    }],

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


productSchema.pre("save", async function (next) {
    this.discount = parseInt(((this.orginal_price - this.sale_price) / this.orginal_price) * 100);
    //       const product = this;

    //   product.variants.forEach(variant => {
    //     variant.options.forEach(option => {
    //       if (!option.sku) {
    //         // Variant nomi va option nomini birlashtirib sku yaratish
    //         option.sku = `${variant.name}-${option.name}`.replace(/\s+/g, '-').toUpperCase();
    //           if(option.options.length) {
    //              option.options.forEach(option2 => {
    //                 option2.sku = `${option.name}-${option2.name}`.replace(/\s+/g, '-').toUpperCase();
    //              });
    //           }
    //       }
    //     });
    //   });

    next();
})


const productModel = model("Product", productSchema);
module.exports = {
    productOptionModel,
    productModel,
}
