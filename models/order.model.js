const {Schema, model} = require("mongoose");

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },

    products: [
        {
            product: {
                 type: Schema.Types.ObjectId,
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
    ]
});


module.exports = model("Order", orderSchema);