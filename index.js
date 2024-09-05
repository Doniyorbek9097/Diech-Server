const fastify = require('fastify')({ logger: false });
const fastifyCookie = require('@fastify/cookie');
const fastifyCors = require('@fastify/cors');
const fastifyHelmet = require('@fastify/helmet');
const fastifyRateLimit = require('@fastify/rate-limit');
const fastifyCompress = require('@fastify/compress');
const fastifyStatic = require('@fastify/static');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
require('dotenv').config();
require('./prototypes');
require('./testbot');
const { serverDB } = require('./config/db');

const app = fastify;

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: "*"
//   }
// });

app.register(fastifyCors, { 
  origin: '*', // Adjust as needed for your application
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
});


// Middleware'larni Fastifyga qo'shish
// app.register(fastifyCors, {
//   origin: function (origin, callback) {
//     const allowedOrigins = ['http://frontend1.com', 'http://frontend2.com', 'http://frontend3.com'];
//     if (allowedOrigins.includes(origin) || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// });

app.register(fastifyCookie);

app.register(fastifyHelmet);

app.register(fastifyCompress);

app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '15 minutes'
});

const baseDir = process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads" : "./uploads";
app.register(fastifyStatic, {
  root: path.join(__dirname, baseDir),
  prefix: '/uploads/', // statik fayllar uchun URL prefiks
});

// Lang middleware
app.addHook('preHandler', async (request, reply) => {
  const lang = request.headers['lang'];
  if (lang) serverDB.setDefaultLanguage(lang);
});

const productRoutes = require("./routes/client/product.route")
const categoryRoutes = require("./routes/client/category.route")
const bannerRoutes = require("./routes/client/banner.route")
const catalogRoutes = require("./routes/client/catalog.route")
const orderRoutes = require("./routes/client/order.route")
const userRoutes = require("./routes/client/user.route")
const shopRoutes = require("./routes/client/shop.route")
const pointRoutes = require("./routes/client/point.route")

// app.register(productRoutes, {prefix:'/api/client/'})
// app.register(categoryRoutes, {prefix:'/api/client/'})
// app.register(catalogRoutes, {prefix:'/api/client/'})
// app.register(orderRoutes, {prefix:'/api/client/'})
// app.register(userRoutes, {prefix:'/api/client/'})
// app.register(shopRoutes, {prefix:'/api/client/'})
// app.register(pointRoutes, {prefix:'/api/client/'})




// Routes papkalarini yuklash
const routesFolder = ['client','seller'];

routesFolder.forEach(dir => {
  fs.readdirSync(path.join(__dirname, 'routes', dir)).forEach(route => {
    if (route.endsWith('.js')) { // Faqat .js fayllarni yuklash
      const routePath = path.join(__dirname, 'routes', dir, route);
      app.register(require(routePath), { prefix: `/api/${dir}` }, (err) => {
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

// Socket.io bilan ishlash uplanis
// io.on('connection', (socket) => {
//   socket.on("add:category", (data) => {
//     io.emit("add:category", data);
//   });

//   socket.on("delete:category", (data) => {
//     io.emit("delete:category", data);
//   });

//   socket.on('disconnect', () => {
//     console.log('Foydalanuvchi ayirildi');
//   });
// });

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000;
const start = async () => {
    try {
      await app.listen({ port: PORT });
      console.log(`Server running at ${PORT}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
