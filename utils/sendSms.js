const axios = require('axios');

const API_URL = 'https://notify.eskiz.uz/api';
const EMAIL = 'doniyorbek3322@gmail.com';
const PASSWORD = 'ylVmbwTaS1ynW5FY1995pBvDhfjV0GlrV7Qow7rf';

async function getSmsToken() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD,
    });
    console.log('Token received:', response.data.data.token);
    return response.data.data.token;
  } catch (error) {
    console.error('Error getting token:', error.response ? error.response.data : error.message);
  }
}


async function sendSms(token, phoneNumber, message) {
  try {
    const response = await axios.post(
      `${API_URL}/message/sms/send`,
      {
        mobile_phone: phoneNumber,
        message: message,
        from: '4546',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('SMS sent response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error.response ? error.response.data : error.message);
  }
}

// (async () => {
//   const token = await getToken();
//   if (token) {
//     const response = await sendSms(token, '998930540633 ', 'Bu Eskiz dan test');
//     console.log('SMS Yuborish natijasi:', response);
//   }
// })();


module.exports = {
    getSmsToken,
    sendSms
}
