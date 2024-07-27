const { Schema, model } = require("mongoose")

const pointSchema = Schema({
    name: {
        type: String,
    },

    location: {
        latitude: Number,
        longitude: Number
    } 
}, 
{ 
    timestamps:true,
    toJSON: { virtuals: true }
}

)

const pointModel = model("Point", pointSchema); 

module.exports = pointModel