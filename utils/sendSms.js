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
        console.error(error);
      }
      
}