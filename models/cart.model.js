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
                ref: "ShopVariant"
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

const cartModel = serverDB.model("Cart", cartSchema)
module.exports = cartModel
