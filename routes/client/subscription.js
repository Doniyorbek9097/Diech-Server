const subscriptionModel = require("../../models/subscription.model");
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
        console.log(subscription)
        try {
            // Obuna mavjudligini tekshirish
            const existingSubscription = await subscriptionModel.findOne({ 'endpoint': subscription.endpoint });

            if (existingSubscription) {
                // Agar obuna mavjud bo'lsa, yangilang
                await subscriptionModel.updateOne({ 'endpoint': subscription.endpoint }, subscription);
                return res.status(200).send({ success: true, message: 'Obuna yangilandi' });
            }
            const newSubscription = await new subscriptionModel(subscription).save(); // MongoDB ga saqlash
            res.status(200).send({ success: true, message: 'Foydalanuvchi obunasi saqlandi' });
        } catch (error) {
            console.error('Obunani saqlashda xatolik:', error);
            res.status(500).send({ success: false, message: 'Obunani saqlab bo\'lmadi' });
        }
    });

    // Saqlangan obunalarga push xabar yuborish
    fastify.get('/send-push', async (req, res) => {
        const payload = JSON.stringify({
            title: "Sizga Muhim yangilik",
            body: "saytimizda 30% foizlik chegirmali mahsulotlar qo'yildi batafsil..."
        });

        try {
            // Barcha saqlangan obunalarni olish
            const subscriptions = await subscriptionModel.find();

            // Har bir obunaga push xabar yuborish
            for (const subscription of subscriptions) {
                try {
                    await webPush.sendNotification(subscription, payload);
                    console.log('Push xabar yuborildi');
                } catch (error) {
                    console.error('Push xabar yuborishda xatolik:', error);
                    // Eskirgan yoki noto'g'ri obunani o'chirish
                    if (error.statusCode === 410) {
                        await subscriptionModel.deleteOne({ 'endpoint': subscription.endpoint });
                    }
                }
            }

            res.status(200).send({ success: true, message: 'Xabarlar yuborildi' });
        } catch (error) {
            console.error('Push xabar yuborishda xatolik:', error);
            res.status(500).send({ success: false, message: 'Xabarlar yuborilmadi' });
        }
    });
};

module.exports = subscriptionRoutes;
