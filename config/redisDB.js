const redis = require('redis');

// Redis mijozini yaratish
const client = redis.createClient({
    url: process.env.REDIS_URL
});

// Xatolarni qayd qilish
client.on('error', (err) => {
    console.error('Redis xatosi:', err);
});

// Redis serveriga ulanishni tekshirish
client.connect().then(() => {
    console.log('Redis serverga muvaffaqiyatli ulanildi!');
}).catch((err) => {
    console.error('Redis serverga ulanish xatosi:', err);
});

module.exports = {
    redisClient: client
};