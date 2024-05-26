const { Schema, model } = require("mongoose");

const orderSchema = new Schema({
    // shop: {
    //     type: Schema.Types.ObjectId,
    //     ref:"Shop",
    //     required: true
    // },

    // seller: {
    //     type: Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true

    // },

    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    address: {
        region: String,
        distirct: String,
        mfy: String,
        street: String,
        house: String,
        house_floor: String,
    },

    delivery: {
        method: {
            type: String,
            enum: ['online', 'offline']
        },

        time: {
            type: String,
            default: Date.now()
        },

        price: {
            type: String,
            default: 0
        },

        comment: {
            type: String
        },
    },



    status: {
        type: String,
        enum: ["new", "accepted", "progress", "shipping", "canceled", "sent"],
        default: "new"
    },

    customerInfo: {
        firstname: String,
        lastname: String,
        username: String,
        phone_number: String
    },

    products: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
            },

            attributes: Schema.Types.Mixed,
            selected_variant:Schema.Types.Mixed,
            orginal_price:Number,
            sale_price:Number,
            discount:Number,
            quantity:Number,

            status: {
                type: String,
                enum: ["notSold","soldOut", "returned"],
                default:'notSold'
            }

        }
    ],

    location: {
        latitude: String,
        longitude: String
    },

    totalAmount: Number,

}, { timestamps: true });


module.exports = model("Order", orderSchema);