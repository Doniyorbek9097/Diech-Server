const { Schema, model } = require("mongoose");

const orderSchema = new Schema({
    shop: {
        type: Schema.Types.ObjectId,
        ref:"Shop",
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true

    },

    customerInfo: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    delivery: {
        type: String,
    },

    totalAmount: Number,
    status: {
        type:String,
        enum:["new","progress","completed","canceled"]
    },

    products: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true
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
                type: Number,
                required: true
            },

        }
    ]

}, { timestamps: true });


module.exports = model("Order", orderSchema);