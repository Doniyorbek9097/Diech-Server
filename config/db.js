const mongoose = require("mongoose");
const mongooseIntl = require('mongoose-intl');

mongoose.plugin(mongooseIntl, { languages: ['uz', 'ru'], defaultLanguage: 'uz', vertuals: {} });

const serverDB = mongoose.createConnection(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Ulanish muvaffaqiyatli bo'lganini tekshirish
serverDB.on('connected', () => {
  console.log('serverDB MongoDB connected successfully');
});

// Ulanish muvaffaqiyatsiz bo'lganini tekshirish
serverDB.on('error', (err) => {
  console.error('serverDB MongoDB connection error:', err);
});

// MongoDB ulanishi uzilganida
serverDB.on('disconnected', () => {
  console.log('serverDB MongoDB disconnected');
});


module.exports = {
  serverDB
}