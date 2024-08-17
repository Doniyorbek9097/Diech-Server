const mongoose = require("mongoose");
const testbotDB = mongoose.createConnection(process.env.TESTBOT_MONGO_URL,  { useNewUrlParser: true, useUnifiedTopology: true });

// Ulanish muvaffaqiyatli bo'lganini tekshirish
testbotDB.on('connected', () => {
    console.log('testbotDB MongoDB connected successfully');
  });
  
  // Ulanish muvaffaqiyatsiz bo'lganini tekshirish
  testbotDB.on('error', (err) => {
    console.error('testbotDB MongoDB connection error:', err);
  });
  
  // MongoDB ulanishi uzilganida
  testbotDB.on('disconnected', () => {
    console.log('testbotDB MongoDB disconnected');
  });


  module.exports = { testbotDB }