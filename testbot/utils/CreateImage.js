const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

class CreateImage {
    constructor(imagePath) {
        this.imagePath = imagePath;
    }

    async init() {
        // Shablon rasmni yuklash
        this.image = await loadImage(this.imagePath);

        // Kanvas va kontekstni yaratish
        this.canvas = createCanvas(this.image.width, this.image.height);
        this.ctx = this.canvas.getContext('2d');

        // Shablonni kanvasga chizish
        this.ctx.drawImage(this.image, 0, 0);

        return this; // Zanjirli chaqiruvlar uchun obyektni qaytarish
    }

    async addText({text, x = 0, y = 0, font = 'cursive', fontSize = 30, maxWidth = 1500, lineHeight = 60, color = 'black'}) {
        // console.log(text)
        this.ctx.font = `${fontSize}px ${font}`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';

        const words = text.split(' ');
        let line = '';
        let lineY = y;

        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth) {
                this.ctx.fillText(line, x, lineY);
                line = word + ' ';
                lineY += lineHeight;
            } else {
                line = testLine;
            }
        }

        this.ctx.fillText(line, x, lineY);

        return this; // Zanjirli chaqiruvlar uchun obyektni qaytarish
    }

    async addImage({ image, x = 100, y = 100, width = 100, height = 100 }) {
        const imageFile = await loadImage(image);
        this.ctx.drawImage(imageFile, x, y, width, height);
        return this; // Zanjirli chaqiruvlar uchun obyektni qaytarish
    }

    async save(outputPath) {
        const buffer = this.canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`Sertifikat saqlandi: ${outputPath}`);
        return outputPath; // Zanjirli chaqiruvlar uchun obyektni qaytarish
    }
}

module.exports = { CreateImage };
