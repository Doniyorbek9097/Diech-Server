const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const mkdirp = require("mkdirp");
const sharp = require("sharp");
const { generateOTP } = require("../utils/otpGenrater");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const slugify = require("slugify")
const dateFns = require("date-fns")

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

class File {
    async photoUpload({ part, width = 800, format = "webp", quality = 100, foldername = "images" }) {
        try {
            const uploadPath = `${process.env.STATIC_FOLDER}/${foldername}`;
            if (!fs.existsSync(uploadPath)) mkdirp.sync(uploadPath);

            const timestamp = dateFns.format(new Date(), 'dd.MM.yyyy HH-mm-ss.SSS')
            const originalName = path.basename(part.filename, path.extname(part.filename));
            const fileName = `${originalName}-${slugify(`${timestamp}-${generateOTP(5)}.webp`)}`;

            const fileBuffer = await part.toBuffer();
            await sharp(fileBuffer)
                .resize({ width })
                .toFormat(format, { quality })
                .toFile(path.join(uploadPath, fileName));
            const url = `${process.env.BASE_API_URL}/uploads/${foldername}/${fileName}`;
            return url;

        } catch (error) {
            console.log(error)
        }
    }


    async remove(files, foldername = "images") {
        const baseDir = `${process.env.STATIC_FOLDER}/${foldername}`;

        if (Array.isArray(files) && files !== null && files !== undefined) {
            await Promise.all(files.map(async (fileName) => {
                const filePath = path.join(baseDir, path.basename(fileName));
                try {
                    await unlinkAsync(filePath);
                } catch (err) {
                    console.error(err);
                    return err;
                }
            }));

        } else if (files !== null && files !== undefined) {
            const filePath = path.join(baseDir, path.basename(files));
            try {
                await unlinkAsync(filePath);
            } catch (err) {
                console.error(err);
                return err;
            }
        }
    }

}


module.exports = new File();