const { Schema } = require("mongoose")
const { serverDB } = require("../config/db")

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

const pointModel = serverDB.model("Point", pointSchema); 

module.exports = pointModel