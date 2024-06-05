const mongoose = require("mongoose");
const mongooseIntl = require('mongoose-intl');
mongoose.plugin(mongooseIntl, { languages: ['uz', 'ru'], defaultLanguage: 'uz', vertuals: {} });

const connectDB = async () => {
    try {
      const connect =  await mongoose.connect(process.env.MONGO_URL,  { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("MongoDBga muvaffaqiyatli ulanildi!")
    } catch (error) {
        console.log(error)
    }   
}

connectDB();