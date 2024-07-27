const mongooose = require("mongoose");

const Schema = new mongooose.Schema({
    image: {
        type: String,
        intl: true
    },
    slug:{
        type:String,
    }
},

{
    timestamps: true,
    toJSON: { virtuals: true}
}
);

const carouselModel = mongooose.model("Carousel", Schema);
module.exports = carouselModel
