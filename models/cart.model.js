const { Schema, model } = require("mongoose");

const cartSchema = Schema({
    products: [
        {   
            product_id: {
                type: Schema.Types.ObjectId,
                ref: "ShopProducts"
            },
            variant_id: {
                type: Schema.Types.ObjectId,
                ref: "ShopVariants"
            },
            
            shop: {
                type: Schema.Types.ObjectId,
                ref: "Shop"
            },

            owner: {
                type: Schema.Types.ObjectId,
                ref: "User"
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

module.exports = model("Cart", cartSchema);
