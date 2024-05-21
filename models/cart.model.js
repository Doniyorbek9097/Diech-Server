const { Schema, model } = require("mongoose");

const cartSchema = Schema({
    products: [
        {
           product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required:true
            },

            shop: {
                type: Schema.Types.ObjectId,
                ref: "Shop"
            },

            attributes: Schema.Types.Mixed,
            orginal_price:Number,
            sale_price: Number,
            quantity: {
                type:Number,
                required:true
            },
            
        }
    ],

    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires:3600 
    }

},{timestamps:true});

module.exports = model("Cart", cartSchema);