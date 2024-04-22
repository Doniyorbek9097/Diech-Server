const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
    products: [
        {
           product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required:true
            },

            color: {
                type: String,
            },

            size: {
                type: String,
            },

            memory: {
                type: String,
            },

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

module.exports = mongoose.model("Cart", cartSchema);