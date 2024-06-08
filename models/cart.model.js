const { Schema, model } = require("mongoose");

const cartSchema = Schema({
    products: [
        {
            _id: String,
            name: String,
            slug: String,
            image:String,
            attributes: Schema.Types.Mixed,
            orginal_price: Number,
            sale_price: Number,
            discount: Number,
            isStock:Number,
            quantity: Number,
            shop: {
                type: Schema.Types.ObjectId,
                ref: "Shop"
            },

            owner: {
                type: Schema.Types.ObjectId,
                ref:"User"
            }
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    }

}, { timestamps: true });

module.exports = model("Cart", cartSchema);