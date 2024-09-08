const { Schema, model } = require('mongoose');

// Foydalanuvchi obuna modeli
const subscriptionSchema = new Schema({
  endpoint: { type: String, required: true }, 
  keys: {
    auth: { type: String, required: true },
    p256dh: { type: String, required: true }
  }
});

const subscriptionModel = model('Subscription', subscriptionSchema);

module.exports = subscriptionModel;