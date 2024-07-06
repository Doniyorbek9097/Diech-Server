const http = require("http");
const fs = require('fs')
const path = require("path")
const express = require("express");
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const cors = require("cors");
var bodyParser = require('body-parser');
require("dotenv/config");
require("./config/db");
// const redisClient = require("./config/redisDB")
// require("./bot");

const mongoose = require("mongoose");
const { removeDuplicates } = require("./utils/removeDuplicates");
const app = express();


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin:"*",
        methods: "*"
    }
})


const corsOptions = {
    origin: process.env.BASE_URL || 'http://localhost:3000', // frontend domeningizni kiriting
    credentials: true // cookie'larni ruxsat berish
};

app.use(cors(corsOptions));

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use(cookieParser())

const baseDir = process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads" : "./uploads";
app.use("/uploads", express.static(baseDir));



app.use("/", (req, res, next) => {
    const lang = req.headers['lang']
    if(lang) mongoose.setDefaultLanguage(lang);
    return next();
});


['client', 'admin', 'seller'].forEach(dir => {
    fs.readdirSync(`./routes/${dir}`).forEach(route => {
      app.use(`/api/${dir}/`, require(`./routes/${dir}/${route}`));
    });
  });


// Socket.io bilan ishlash uplanish
io.on('connection', (socket) => {
    // console.log('Foydalanuvchi bog\'landi '+ socket.id);
    
    socket.on("add:category", (data) => {
        io.emit("add:category", data)
    })

    socket.on("delete:category", (data) => {
        io.emit("delete:category", data)
    })


    socket.on('disconnect', () => {
        console.log('Foydalanuvchi ayirildi');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`server is runinng on port ${PORT}`))


