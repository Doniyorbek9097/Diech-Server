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

    address: {
        region: String,
        distirct: String,
        street: String,
        house: String,
        house_floor: String,
        location: {
            latitude: String,
            longitude: String
        }
    },

    delivery_method: {
        type: String,
        enum:['online','offline']
    },

    delivery_time: {
        type: String,
    },

    comment: String,
    totalAmount: Number,

    status: {
        type:String,
        enum:["new","progress","completed","canceled"],
        default:"new"
    },

    customerInfo: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
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