const { Schema, model } = require("mongoose")

const optionValuesSchema = Schema({
  label: {
    type: String,
    intl: true
  },
  images: {
    type: Array,
    default: undefined
  },

  option_id: {
    type: Schema.Types.ObjectId,
    ref: "Option"
  },
},
  {
    toJSON: { virtuals: true }
  }
)

const optionValuesModel = model("OptionValues", optionValuesSchema);

const optionSchema = Schema({
  label: {
    type: String,
    intl: true
  },
  images: {
    type: Array,
    default: undefined,
  }

},
  {
    toJSON: { virtuals: true }
  })

optionSchema.virtual('options', {
  ref: "OptionValues",
  localField: "_id",
  foreignField: "option_id"
})

const optionModel = model("Option", optionSchema);

module.exports = {
  optionModel,
  optionValuesModel
}