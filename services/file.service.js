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
const { format } = require("date-fns")

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

class File {
    async upload(req, files, filePathName = "diech") {
        const baseDir = process.env.NODE_ENV === 'production' ? `../../../../mnt/data/uploads/images` : `./uploads`;

        if (!fs.existsSync(baseDir)) mkdirp.sync(baseDir);

        // Array fayllarni qayta ishlash
        if (Array.isArray(files) && files.length > 0) {
            const filePromises = files.map((file, index) => {
                return new Promise(async (resolve, reject) => {
                    if (typeof file === 'string' && file.includes(';base64,')) {
                        const base64Index = file.indexOf(';base64,') + ';base64,'.length;
                        if (base64Index === 7) {
                            reject('Invalid base64 string');
                        }

                        const timestamp = format(new Date(), 'dd.MM.yyyy HH-mm-ss.SSS');
                        const baseFilename = slugify(`diech-${timestamp}-${generateOTP(5)}.webp`);
                        const filePath = path.join(baseDir, baseFilename);
                        const base64Image = file.substring(base64Index);
                        const imageBuffer = Buffer.from(base64Image, 'base64');

                        try {
                            await sharp(imageBuffer)
                                .resize({ width: 800 })
                                .toFormat('webp')
                                .toFile(filePath);
                            resolve(`${req.protocol}://${req.headers.host}/uploads/${baseFilename}`);
                        } catch (err) {
                            console.log(err?.message);
                            throw err;
                        }

                    } else {
                        return resolve(file);
                    }

                });
            });

            try {
                const filePaths = await Promise.all(filePromises);
                return filePaths;
            } catch (err) {
                console.log(err?.message);
                throw err;
            }

            // Yagona fayl stringini qayta ishlash
        } else if (typeof files === 'string' && files.includes(';base64,')) {
            const base64Index = files.indexOf(';base64,') + ';base64,'.length;
            if (base64Index === 7) {
                throw new Error('Invalid base64 string');
            }
            
            const timestamp = format(new Date(), 'dd.MM.yyyy HH-mm-ss.SSS');
            const baseFilename = slugify(`diech-${timestamp}-${generateOTP(5)}.webp`);
            const filePath = path.join(baseDir, baseFilename);
            const base64Image = files.substring(base64Index);
            const imageBuffer = Buffer.from(base64Image, 'base64');

            try {
                await sharp(imageBuffer)
                    .resize({ width: 800 })
                    .toFormat('webp')
                    .toFile(filePath);
                return `${req.protocol}://${req.headers.host}/uploads/${baseFilename}`;
            } catch (err) {
                console.log(err?.message);
                throw err;
            }

            // Agar fayl valid bo'lmasa, oddiy qaytariladi
        } else {
            return files;
        }
    }

    async remove(files) {
        const baseDir = process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads" : "./uploads";

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
            console.log(files)
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
