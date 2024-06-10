const http = require("http");
const express = require("express");
const { Server } = require('socket.io');
const cors = require("cors");
var bodyParser = require('body-parser');
require("dotenv/config");
require("./config/db");
// const redisClient = require("./config/redisDB")
// require("./bot");
const adminRoutes = require("./routes/admin");
const sellerRoutes = require("./routes/seller");
const clientRoutes = require("./routes/client");

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

app.use(cors());
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use("/uploads", express.static("var/data/uploads"))
app.use("/", (req, res, next) => {
    const lang = req.headers['lang']
    if(lang) mongoose.setDefaultLanguage(lang);
    return next();
})

adminRoutes.forEach(route => app.use("/api/admin/", route));
clientRoutes.forEach(route => app.use("/api/client/", route));
sellerRoutes.forEach(route => app.use("/api/seller/", route));

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




const { Infobip, AuthType } = require('@infobip-api/sdk');
console.log(process.env.INFOBIP_URL);
console.log(process.env.INFOBIP_KEY);

const sendSms = async (to, text) => {
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

