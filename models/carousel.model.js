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

module.exports = mongooose.model("Carousel", Schema);