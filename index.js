const fastify = require('fastify')({ 
  logger: false,
  bodyLimit: 5 * 1024 * 1024
});
const fastifyCookie = require('@fastify/cookie');
const fastifyCors = require('@fastify/cors');
const fastifyHelmet = require('@fastify/helmet');
const fastifyRateLimit = require('@fastify/rate-limit');
const fastifyCompress = require('@fastify/compress');
const fastifyStatic = require('@fastify/static');
const fastifyMultiPart = require("@fastify/multipart")
const formbody = require("@fastify/formbody")
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
require('dotenv').config();
require('./prototypes');
require('./testbot');
// require("./bot")
const { fileNotActiveRemove } = require("./services/file-cron.service")
const { serverDB } = require('./config/db');
// fileNotActiveRemove()

const io = new Server(fastify.server, {
  cors: {
    origin: "*",
    methods: "*"
  }
});

fastify.register(fastifyCors, { 
  origin: '*', // Adjust as needed for your aplication
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
});


// Middleware'larni Fastifyga qo'shish
// fastify.register(fastifyCors, {
//   origin: function (origin, callback) {
//     const allowedOrigins = ['http://frontend1.', 'http://frontend2.com', 'http://frontend3.com'];
//     if (allowedOrigins.includes(origin) || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// });

fastify.register(formbody)
fastify.register(fastifyMultiPart)
fastify.register(fastifyCookie);
// fastify.register(fastifyHelmet);
fastify.register(fastifyCompress);
// fastify.register(fastifyRateLimit, {
//   max: 100,
//   timeWindow: '1 minutes'
// });

const baseDir = process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads" : "./uploads";

fastify.register(fastifyStatic, {
  root: path.join(__dirname, baseDir),
  prefix: '/uploads/', // statik fayllar uchun URL prefiks
});

// Lang middleware
fastify.addHook('preHandler', async (request, reply) => {
  const lang = request.headers['lang'];
  if (lang) serverDB.setDefaultLanguage(lang);
});



// Custom error handler
fastify.setErrorHandler(function (error, request, reply) {
  // Log the error
  fastify.log.error(error);

  // Send a custom error response
  return reply.status(error.statusCode || 500).send({
    error: error.message,
    stack: error.stack, // Bu qismni qo'shsangiz stack trace ko'rsatiladi
  });
});



// Routes papkalarini yuklash
const routesFolder = ['client','seller','admin'];

routesFolder.forEach(dir => {
  fs.readdirSync(path.join(__dirname, 'routes', dir)).forEach(route => {
    if (route.endsWith('.js')) { // Faqat .js fayllarni yuklash
      const routePath = path.join(__dirname, 'routes', dir, route);
      fastify.register(require(routePath), { prefix: `/api/${dir}` }, (err) => {
        if (err) {
          console.error(`Failed to load route ${routePath}:`, err);
          process.exit(1); // Serverni to'xtatish
        } else {
          console.log(`Route ${routePath} successfully registered`);
        }
      });
    }
  });
});

// // Socket.io bilan ishlash uplanis
// io.on('connection', (socket) => {
//   socket.on("add:category", (data) => {
//     console.log(data);
    
//     io.emit("add:category", data);
//   });

//   socket.on("delete:category", (data) => {
//     io.emit("delete:category", data);
//   });

//   socket.on('disconnect', () => {
//     console.log('Foydalanuvchi ayirildi');
//   });
// });



const locations = {latitude: 22222, longitude:33333}; // Joylashuvlarni vaqtinchalik saqlash uchun obyekt

// API orqali joylashuvlarni qabul qilish
fastify.post('/location', async (req, reply) => {
  const { chatId, latitude, longitude } = req.body;
  // Joylashuvni saqlash va real vaqt rejimida front-endga yuborish
  locations[chatId] = { latitude, longitude };
  io.emit('locationUpdate', req.body);

  reply.send({ status: 'Location saved' });
});


// // WebSocket ulanishlarini kuzatish
// io.on('connection', (socket) => {
//   console.log('New client connected');

//   // Mavjud joylashuvlarni yuborish
//   socket.emit('initialLocations', locations);

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    fastify.listen({ port: PORT, host: '0.0.0.0' }); // Yangi uslubda port va hostni ko'rsatish
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();



