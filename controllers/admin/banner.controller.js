const slugify = require("slugify")
const fileService = require("../../services/file.service2")
const bannerModel = require("../../models/banner.model")

class Banner {
    async create(req, reply) {
        const { image, slug } = req.body;
        try {
            const result = await new bannerModel({
                slug: slug,
                image: {
                    uz: image.uz.url,
                    ru: image.ru.url
                },
                image: {
                    uz: image.uz._id,
                    ru: image.ru._id
                },

            }).save();
            return reply.send({
                data: result,
                message: "Success"
            });

        } catch (error) {
            console.log(error);
            image?.uz && await fileService.remove(image.uz)
            image?.ru && await fileService.remove(image.uz)
            return reply.code(500).send(error.message);
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
    
            return reply.send({ data: result, message:"Success"});
    
        } catch (error) {
            console.log(error)
            return  reply.status(500).send(error.message)
        }
    }

}

module.exports = new Banner();