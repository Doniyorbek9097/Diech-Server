const path = require("path")
const fs = require("fs")
const { generateOTP } = require("./otpGenrater");
const sharp = require("sharp");
const mkdirp = require("mkdirp")
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


class Base64ToFile {
    constructor(request, response) {
        this.request = request;
        this.response = response;
        this._file_name = `image-${generateOTP(10)}.webp`;
        this._file_path = "/mnt/data/uploads";
        this._bufferInput = "";
        this._width = "";
        this._height = "";
        this._format = "";
    }


    fileName(name) {
        if(name) {
           this._file_name = path.basename(name);
        } 
        
        return this;
    }

    fileFormat(format) {
        this._file_format = format;
        return this;
    }
    
    filePath(filePath) {
        this._file_path = filePath;
        return this;
    }

    bufferInput(base64) {
        this._bufferInput = base64;
        return this;
    }


    save() {
        return new Promise((resolve, rejact) => {
            if(!fs.existsSync(this._file_path)) {
                mkdirp.sync(this._file_path)
            }
            // if(Array.isArray(this._bufferInput) && this._bufferInput !== null) {
            //     const filePaths = [];
            //     for (const file of this._bufferInput) {
            //     if(typeof file !== 'string' || !file.includes("base64")) return;
            //         const filePath = path.join(this._file_path, this._file_name);
            //         const matches = file.toString().match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            //         fs.writeFile(
            //             filePath, 
            //             Buffer.from(matches[2], 'base64'),
            //             (err) => err ? rejact(err) : filePaths.push(`${this.request.protocol}://${this.request.headers.host}/uploads/${this._file_name}`)
            //         );
            //     }
        
            //     resolve(filePaths)
            // }
        

        if(typeof this._bufferInput !== 'string' || this._bufferInput.includes("base64") == false)
        resolve(this._bufferInput);
        const filePath = path.join(this._file_path, this._file_name)

        const base64Index = this._bufferInput.indexOf(';base64,') + ';base64,'.length;
        const base64Image = this._bufferInput.substring(base64Index);
        const imageBuffer = Buffer.from(base64Image, 'base64');
        if(base64Index !== 7) {
            sharp(imageBuffer)
            .resize({ width: 800 })
            .toFormat('webp') 
            .toFile(filePath, (err) => {
                if (err) throw err;
                resolve(`${this.request.protocol}://${this.request.headers.host}/uploads/${this._file_name}`);

            });

        }
        

        
    })

}   
    
} 


module.exports = {
    Base64ToFile
};


// module.exports = resizeImage = (req, filePath, w=500, h=700) => {
//     if(!fs.existsSync(filePath)) return;
//     if (Array.isArray(filePath) && filePath !== null) {
//         const files = [];
//         for (const filepath of filePath) {
//             const fileName = `image-${generateOTP(7)}.webp`;
//             const newFilePath = path.join(path.dirname(filepath), fileName);

//             ffmpeg()
//                 .input(filepath)
//                 .outputOptions([`-vf crop=${w}:${h}`])
//                 .toFormat('webp')
//                 .on('end', () => {
//                     fs.unlink(filePath, (err) => {
//                         if (err) console.log(err);
//                     })
//                 })
//                 .save(newFilePath)


//             files.push(`${req.protocol}://${req.headers.host}/uploads/${fileName}`)
//         }

//         return files
//     }

//     const fileName = `image-${generateOTP(7)}.webp`;

//     const newFilePath = path.join(path.dirname(filePath), fileName);
//     ffmpeg()
//     .input(filePath)
//     .outputOptions([`-vf crop=${w}:${h}`])
//     .toFormat('webp')
//     .on('end', () => {
//         fs.unlink(filePath, (err) => {
//             if (err) console.log(err);
//         })
//     })
//     .save(newFilePath)
    
//     return `${req.protocol}://${req.headers.host}/uploads/${fileName}`;
// }