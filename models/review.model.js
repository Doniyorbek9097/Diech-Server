const { Schema } = require("mongoose");
const { serverDB } = require("../config/db");

const reviewSchema = Schema(
  {
    name: { type: String, required: true },
    rating: { 
      type: Number, 
      required: true,
      min: 1,  // Minimum rating
      max: 5   // Maximum rating
    },
    images: [
      {
          image_id: {
              type: Schema.Types.ObjectId,
              ref:"File",
              required: true
          },
          small: {
              type: String,
              required: true
          },
          large: {
              type: String,
              required: true
          }
      }
  ],
    comment: { 
      type: String, 
      required: true,
      maxlength: 500  // Izoh uzunligini cheklash
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = serverDB.model("Reviews", reviewSchema);
