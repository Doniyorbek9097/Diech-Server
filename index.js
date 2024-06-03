const http = require("http");
const express = require("express");
const { Server } = require('socket.io');
const cors = require("cors");
var bodyParser = require('body-parser');
require("dotenv/config");
require("./config/db");
const redisClient = require("./config/redisDB")
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
app.use("/uploads", express.static("uploads"))
app.use("/", (req, res, next) => {
    const lang = req.headers['lang']
    if(lang) mongoose.setDefaultLanguage(lang);
    return next();
})

adminRoutes.forEach(route => app.use("/api/admin/", route));
clientRoutes.forEach(route => app.use("/api/client/", route));
sellerRoutes.forEach(route => app.use("/api/seller/", route));

// Socket.io bilan ishlash
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



const nestedArray = [
    {
        type:"color",
        properties:[
            {
                name:"red",
                price:"3000",
                images: [],
                children: [
                    {
                        type:"size",
                        properties: [
                            {
                                name:"xs",
                                price:"2000",
                                children: [{
                                    type:"material",
                                    properties: [
                                        {
                                            name:"gullik",
                                            price:"5000",
                                            children: []
                                        },
                                        {
                                            name:"gulsiz",
                                            children: []
                                        }
                                    ]
                                }]
                            },

                            {
                                name:"xl"
                            }
                        ]
                    }
                ]
            },

            {
                name:"blue",
                images: [],
                children: [
                    {
                        type:"size",
                        properties: [
                            {
                                name:"xs",
                                children: [{
                                    type:"material",
                                    properties: [
                                        {
                                            name:"gullik",
                                            children: []
                                        },
                                        {
                                            name:"gulsiz",
                                            children: []
                                        }
                                    ]
                                }]
                            },

                            {
                                name:"xxl"
                            }
                        ]
                    }
                ]
            }
        ]
    }
]


const gen = (nestedArray, attributes = {}, variants = []) => {
    nestedArray.forEach((item) => {
        const type = item.type;
        attributes[type] = attributes[type] || [];

        item.properties.forEach((prop) => {
            const propName = prop.name;
            const propSku = propName.toLowerCase().replace(/\s+/g, '-') + '-' + type; // SKU nomini generatsiya qilish
            const images = prop.images || [];

            attributes[type].push({
                name: propName,
        sku: propSku, // SKU ni qo'shish
        images: images
      });

            let variant = {
                sku: propSku,
                price: prop.price || "",
                quantity: prop.quantity || 0
            };

            variants.push(variant);

            if (prop.children && prop.children.length > 0) {
                gen(prop.children, attributes, variants, propSku);
            }
        });

    });

    return {
        attributes,
        variants
    };
};

// const a = gen(nestedArray);
// console.log(removeDuplicates(a.attributes));
// console.log(a.variants);
// console.log(a.attributes);


