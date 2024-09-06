const slugify = require("slugify")
const fileService = require("../../services/file.service")
const bannerModel = require("../../models/banner.model")

class Banner {
    async create(req, reply) {
        const { image, slug } = req.body;
        req.body.slug = slugify(slug);
        image && (req.body.image.uz = await fileService.upload(req, image.uz));
        image && (req.body.image.ru = await fileService.upload(req, image.ru));

        try {
            const result = await new bannerModel(req.body).save();
            return reply.send({
                data: result,
                message: "Success"
            });

        } catch (error) {
            console.log(error);
            image?.uz && await fileService.remove(image.uz)
            image?.ru && await fileService.remove(image.uz)
            return reply.status(500).send(error.message);
        }
    }


    async all(req, reply) {
        try {       
            let result = await bannerModel.find();
           return reply.send({
             data: result,
             message:"Success"
           });
    
        } catch (error) {
            console.log(error);
            return reply.status(500).send(error.message)
        }
    }


    async deleteById(req, reply) {
        try {
            const result = await bannerModel.findByIdAndDelete(req.params.id).lean()
            const { image } = result;
            image.uz && await fileService.remove(image.uz)
            image.ru && await fileService.remove(image.ru)    
    
            return reply.send({ data: replyult, message:"Success"});
    
        } catch (error) {
            console.log(error)
            return  reply.status(500).send(error.message)
        }
    }

}

module.exports = new Banner();