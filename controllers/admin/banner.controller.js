const slugify = require("slugify")
const fileService = require("../../services/file.service")
const bannerModel = require("../../models/banner.model")

class Banner {
    async create(req, res) {
        const { image, slug } = req.body;
        req.body.slug = slugify(slug);
        image && (req.body.image.uz = await fileService.upload(req, image.uz));
        image && (req.body.image.ru = await fileService.upload(req, image.ru));

        try {
            const result = await new bannerModel(req.body).save();
            return res.json({
                data: result,
                message: "Success"
            });

        } catch (error) {
            console.log(error);
            image?.uz && await fileService.remove(image.uz)
            image?.ru && await fileService.remove(image.uz)
            res.status(500).json(error.message);
        }
    }


    async all(req, res) {
        try {       
            let result = await bannerModel.find();
           return res.json({
             data: result,
             message:"Success"
           });
    
        } catch (error) {
            console.log(error);
            res.status(500).send(error.message)
        }
    }


    async deleteById(req, res) {
        try {
            const result = await bannerModel.findByIdAndDelete(req.params.id).lean()
            const { image } = result;
            image.uz && await fileService.remove(image.uz)
            image.ru && await fileService.remove(image.ru)    
    
            res.json({ data: result, message:"Success"});
    
        } catch (error) {
            console.log(error)
            res.status(500).send(error.message)
        }
    }

}

module.exports = new Banner();