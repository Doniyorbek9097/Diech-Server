const { Schema, model } = require("mongoose");

const bannerSchema = new Schema({
    image: {
        type: String,
        intl: true
    },
    slug:{
        type:String,
    },

    category_banner: {
        type: Schema.Types.ObjectId,
        ref:"Category"
    },

},

{
    timestamps: true,
    toJSON: { virtuals: true}
}
);

const bannerModel = model("Banner", bannerSchema);

module.exports = bannerModel
