const { Schema, model }  = require("mongoose")

const optionValuesSchema = Schema({
   name: {
      type:String,
      intl: true
   },
   option_id: {
      type: Schema.Types.ObjectId,
      ref:"Option"
   }
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
    }
}, 
{
  toJSON: { virtuals: true }
})

const optionModel = model("Option", optionSchema);

module.exports = {
    optionModel,
    optionValuesModel
}