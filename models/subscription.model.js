const { Schema } = require('mongoose');
const { serverDB } = require("../config/db")

// Foydalanuvchi obuna modeli
const subscriptionSchema = Schema({
  endpoint: { type: String }, 
  keys: {
    auth: { type: String },
    p256dh: { type: String }
  }
});

const subscriptionModel = serverDB.model('Subscription', subscriptionSchema);

module.exports = subscriptionModel;
