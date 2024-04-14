const multer = require("multer");
const path = require("path")
const fs = require("fs")
const crypto = require("crypto");

const folder = path.join(__dirname, '../uploads')

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const newPath = path.join(__dirname, '../uploads');
        cb(null, newPath)
    
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

    // limits: {
    //     fileSize: 1024 * 1024
    // }

});



// Sharp bilan o'lchamni o'zgartirish middleware

module.exports = {
    upload,
}