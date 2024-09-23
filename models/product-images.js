const { Schema } = require("mongoose");
const { serverDB } = require("../config/db");
const productImagesSchema = new Schema({
 product_id: {
    type: Schema.Types.ObjectId,
    ref:"Product",
    required: true
 },
 images:{
    type:Array,
    required: true
 }   
});

const productImages = serverDB.model("productImages", productImagesSchema);

module.exports = productImages;
