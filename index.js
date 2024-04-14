const express = require("express");
const cors = require("cors");
var bodyParser = require('body-parser');
require("dotenv/config");
require("./config/db");
// require("./bot");
const adminRoutes = require("./routes/admin");
const sellerRoutes = require("./routes/saller");
const clientRoutes = require("./routes/client");

const mongoose = require("mongoose");
const app = express();


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
sellerRoutes.forEach(route => app.use("/api/saller/", route));




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is runinng on port ${PORT}`))




