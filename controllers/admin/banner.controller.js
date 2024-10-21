const slugify = require("slugify")
const fileService = require("../../services/file.service2")
const fileModel = require("../../models/file.model")
const bannerModel = require("../../models/banner.model")

class Banner {
    async create(req, reply) {
        const { image, slug } = req.body;
        try {
            const newBanner = await new bannerModel(req.body).save();

            if (newBanner.image) {
                await fileModel.updateOne(
                    { image_url: newBanner.image.uz },
                    { isActive: true, owner_id: newBanner._id, owner_type: "banner" },
                );
                await fileModel.updateOne(
                    { image_url: newBanner.image.ru },
                    { isActive: true, owner_id: newBanner._id, owner_type: "banner" },
                );
            }

            if (newBanner.smallImage) {
                await fileModel.updateOne(
                    { image_url: newBanner.smallImage.uz },
                    { isActive: true, owner_id: newBanner._id, owner_type: "banner" },
                );
                await fileModel.updateOne(
                    { image_url: newBanner.smallImage.ru },
                    { isActive: true, owner_id: newBanner._id, owner_type: "banner" },
                );
            }

            return reply.send({
                data: newBanner,
                message: "Success"
            });

        } catch (error) {
            console.log(error);
            return reply.code(500).send(error.message);
        }
    }


    async all(req, reply) {
        try {
            let result = await bannerModel.find();

            return reply.send({
                data: result,
                message: "Success"
            });

        } catch (error) {
            console.log(error);
            return reply.status(500).send(error.message)
        }
    }


    async deleteById(req, reply) {
        try {
            const { id } = req.params;
            const banner = await bannerModel.findById(id).lean();
            console.log(banner?.image)
            if (banner?.image) {
                await fileService.remove(banner.image.uz);
                await fileService.remove(banner.image.ru);
                await fileModel.findOneAndDelete({ image_url: banner.image.uz });
                await fileModel.findOneAndDelete({ image_url: banner.image.ru });
            }

            if (banner?.smallImage) {
                await fileService.remove(banner.smallImage.uz);
                await fileService.remove(banner.smallImage.ru);
                await fileModel.findOneAndDelete({ image_url: banner.smallImage.uz });
                await fileModel.findOneAndDelete({ image_url: banner.smallImage.ru });
            }

            const result = await bannerModel.findByIdAndDelete(id).lean()
            return reply.send({ data: result, message: "Success" });

        } catch (error) {
            console.log(error)
            return reply.status(500).send(error.message)
        }
    }

}

module.exports = new Banner();