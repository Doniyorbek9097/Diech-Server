const { Schema,  } = require("mongoose");
const { serverDB } = require("../config/db")

const productSchema = Schema({
    _id: String,
    name: {
        type: String,
        intl: true,
    },
    images:[String],
    orginal_price: Number,
    sale_price: Number,
    discount: Number,
    quantity: Number,
    slug: String,
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    shop: {
        type: Schema.Types.ObjectId,
        ref: "Shop"
    },

    status: {
        type: String,
        enum: ["notSold", "soldOut", "returned"],
        default: 'notSold'
    }

},
{ toJSON: { virtuals: true } }
)

const orderSchema = new Schema({
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

    products: [productSchema],

    location: {
        latitude: String,
        longitude: String
    },

    totalAmount: Number,

}, { timestamps: true });

const orderModel = serverDB.model("Order", orderSchema);
module.exports = orderModel