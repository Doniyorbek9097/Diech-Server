require('dotenv').config();
const { Infobip, AuthType } = require('@infobip-api/sdk');

exports.sendSms = async (to, text) => {
    const infobipClient = new Infobip({
        baseUrl: process.env.INFOBIP_URL,
        apiKey: process.env.INFOBIP_KEY,
        authType: AuthType.ApiKey, 
    });
      
    try {
        const infobipResponse = await infobipClient.channels.sms.send({
            type: "text",
            messages: [{
                destinations: [
                    {
                        to: to,
                    },
                ],
                from: "Olcha.uz",
                text: text,
            }],
        });

        return infobipResponse;
    } catch (error) {
        if (error.response) {
            // API tomonidan qaytarilgan xato
            console.error('API xato kodi:', error.response.status);
            console.error('API xato ma\'lumotlari:', error.response.data);
        } else {
            // Boshqa xatolar
            console.error('Xato:', error.message);
        }
    }
}

// Misol uchun chaqirish
// exports.sendSms('998930540633', 'Salom, bu test xabari!');
