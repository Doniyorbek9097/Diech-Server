const shopModel = require("../../models/shop.model");
const fileService = require('../../services/file.service');

async function shopRoutes(fastify, options) {

    // GET all shops by user ID
    fastify.get("/shops/:user_id", async (request, reply) => {
        try {
            const shops = await shopModel.find({ owner: request.params.user_id })
                .populate({
                    path: "products",
                    populate: {
                        path: 'product'
                    }
                });
            return reply.status(200).send(shops);
        } catch (error) {
            console.log(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // GET shop by ID
    fastify.get("/shop_id/:id", async (request, reply) => {
        try {
            const result = await shopModel.findById(request.params.id)
                .populate({
                    path: "products",
                    populate: {
                        path: 'product'
                    }
                });

            return reply.status(200).send(result.toObject());
        } catch (error) {
            console.log(error.message);
            return reply.status(500).send(`Serverda Xatolik ${error.message}`);
        }
    });

    // PUT update shop by ID
    fastify.put("/shop/:id", async (request, reply) => {
        const shopData = request.body;
        try {
            if (shopData?.image) {
                shopData.image = await fileService.upload(request, shopData.image);
            }
            if (shopData?.bannerImage) {
                shopData.bannerImage = await fileService.upload(request, shopData.bannerImage);
            }

            const result = await shopModel.findByIdAndUpdate(request.params.id, shopData, { new: true });
            await fileService.remove(shopData?.deletedImages);
            
            return reply.status(200).send(result);
        } catch (error) {
            if (shopData?.image) {
                await fileService.remove(shopData.image);
            }
            if (shopData?.bannerImage) {
                await fileService.remove(shopData.bannerImage);
            }

            console.log(error.message);
            return reply.status(500).send("Serverda Xatolik " + error.message);
        }
    });
}

module.exports = shopRoutes;
