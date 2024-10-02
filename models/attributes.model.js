const { Schema } = require("mongoose");
const { serverDB } = require("../config/db")

const options = Schema({
    name: {
        type: String,
        intl: true
    },

    color: String
},
{
    toJSON: { virtuals: true }
}
)

const attributeSchema = new Schema({
    label: {
        type: String,
        intl: true
    },
    color: String,
    values: [options],
    isImages: {
        type: Boolean,
        default: false
    },
    isColor: {
        type: Boolean,
        default: false
    }
},
{
    toJSON: { virtuals: true }
}
);

const attributeModel = serverDB.model("Attributes", attributeSchema);

module.exports = attributeModel;
