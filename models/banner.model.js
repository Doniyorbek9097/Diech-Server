const { Schema } = require("mongoose");
const { serverDB } = require("../config/db")


const bannerSchema = new Schema({
    image: {
        type: String,
        intl: true
    },

    image_id: {
        uz: String,
        ru: String
    },

    smallImage: {
        type: String,
        intl: true
    },

    slug:{
        type:String,
    },

    category: {
        type: Schema.Types.ObjectId,
        ref:"Category"
    },

},

{
    timestamps: true,
    toJSON: { virtuals: true}
}
);

const bannerModel = serverDB.model("Banner", bannerSchema);

module.exports = bannerModel
