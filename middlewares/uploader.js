const
    formidable = require('formidable'),
    sharp = require("sharp"),
    fs = require("fs"),
    path = require("path"),
    { generateOTP } = require("../utils/otpGenrater");
    

const folder = path.join(__dirname, '../uploads')
const resizeFolder = path.join(__dirname, "../resized");
if (!fs.existsSync(folder) && !fs.existsSync(resizeFolder)) {
    fs.mkdirSync(folder)
    fs.mkdirSync(resizeFolder)
}

exports.uploader = ({ req }) => {
    const form = new formidable.IncomingForm({
        multiples: true,
        uploadDir: folder,

    });

    return new Promise((resolve, rejact) => {
        form.parse(req, async (err, fields, files) => {
            return console.log(files);
            if (err) {
                setInterval(() => rejact("fayl yuklashda muammo"), 1000);
                return;
            }

            const uploadedFiles = [];

            // Fayllarni rasm shaklida saqlash
            for (const key in files) {
                for (const item of files[key]) {
                    const newPath = path.join(__dirname, '../uploads', item.originalFilename);
                    fs.renameSync(item.filepath, newPath);
                
                    // Rasmlarni o'zgartirish
                    const newFileName = `${item.originalFilename.split(".")[0]}-${generateOTP()}.webp`;

                    const resizedPath = path.join(__dirname, '../uploads', newFileName);

                    const images = await sharp(newPath)
                            .resize({ fit:"outside", width:100, height: 200})
                            .webp()
                            .toFile(resizedPath)
                            .catch(err => {
                                console.log(err);
                            });

                            fs.unlinkSync(newPath);

                        uploadedFiles.push({ name: newFileName, [key]: `http://localhost:5000/uploads/${newFileName}` });

                 }
            }

            // Fayllarning ma'lumotlarini qaytarish
            setInterval(() => resolve(uploadedFiles), 1000);

        })
    })


}