const multer = require("multer");
const path = require("path")
const fs = require("fs")
const crypto = require("crypto");
const mkdirp = require("mkdirp")

const { baseDir } = require("../config/uploadFolder")

if (!fs.existsSync(baseDir)) {
    mkdirp.sync(baseDir)
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, baseDir)
    
    },
    filename: (req, file, cb) => {
        cb(null, `${crypto.randomBytes(10).toString("hex")}-${file.originalname}`);
    }
});





const upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.webp') {
            const err = new Error('Only images are allowed');
            err.code = "INCCORECT_FILE_TYPE";
            return callback(err, false);
        }
        callback(null, true)
    },

    limits: {
        fileSize: 1024 * 1024
    }

});



// Sharp bilan o'lchamni o'zgartirish middleware

module.exports = {
    upload,
}