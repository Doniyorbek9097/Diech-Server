const { Schema } = require("mongoose");
const { serverDB } = require("../config/db")

const cartSchema = Schema({
    products: [
        {   
            product_id: {
                type: Schema.Types.ObjectId,
                ref: "ShopProducts"
            },
            variant_id: {
                type: Schema.Types.ObjectId,
                ref: "Variant"
            },

            quantity: Number,
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    }

}, 
{ 
    toJSON: { virtuals: true },
    timestamps: true 
});


cartSchema.virtual("product", {
    ref: "ShopProducts",
    localField: "_id",
    foreignField: "products.product_id"
})

cartSchema.virtual("variant", {
    ref: "Variant",
    localField: "_id",
    foreignField: "products.variant_id"
})

const cartModel = serverDB.model("Cart", cartSchema)
module.exports = cartModel
