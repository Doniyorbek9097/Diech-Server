
const subscriptionModel = require("../../models/subscription.model")
const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();
webPush.setVapidDetails(
  'mailto:your-email@example.com',
  "BJEHDwemAMc5GlzctGrN8qfOygZfVLTLgKp1YY4JUmumeVLRGcc5UPxLUBXVAXPHwyUvFD3OjdwA9PcqCaHTtW8",
  "kdo9-vksU-zvU1zhMLD8yNGdj45gRMITiNh35g2wtMc"
);


const subscriptionRoutes = async (fastify, options) => {
    // Foydalanuvchini obuna qilish va ma'lumotlarni bazaga saqlash
    fastify.post('/subscribe', async (req, res) => {
        const subscription = req.body.subscription; // Foydalanuvchi subscription obyektini olamiz

        // Yangi obunani saqlash
        try {
            const newSubscription = new subscriptionModel(subscription);
            console.log(newSubscription);

            await newSubscription.save(); // MongoDB ga saqlash
            res.status(200).send({ success: true, message: 'Foydalanuvchi obunasi saqlandi' });
        } catch (error) {
            console.error('Obunani saqlashda xatolik:', error);
            res.status(500).send({ success: false, message: 'Obunani saqlab bo\'lmadi' });
        }
    });



    // Saqlangan obunalarga push xabar yuborish
fastify.get('/send-push', async (req, res) => {
    const payload = JSON.stringify({
      title: 'Yangilik!',
      body: 'Sizda yangi xabar bor.'
    });
  
    try {
      // Barcha saqlangan obunalarni olish
      const subscriptions = await subscriptionModel.find();
  
      // Har bir obunaga push xabar yuborish
      subscriptions.forEach(subscription => {
        webPush.sendNotification(subscription, payload)
          .then(() => {
            console.log('Push xabar yuborildi');
          })
          .catch(error => {
            console.error('Push xabar yuborishda xatolik:', error);
          });
      });
  
      res.status(200).send({ success: true, message: 'Xabarlar yuborildi' });
    } catch (error) {
      console.error('Push xabar yuborishda xatolik:', error);
      res.status(500).send({ success: false, message: 'Xabarlar yuborilmadi' });
    }
  });  

}

module.exports = subscriptionRoutes;