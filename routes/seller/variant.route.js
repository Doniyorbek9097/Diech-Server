const fileService = require('../../services/file.service2')
const fileModel = require("../../models/file.model")

async function shopVariantRoutes(fastify, options) {
    // GET route to fetch variants by ID
    fastify.get('/get-variants/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const variants = await shopProductVariantModel.find({ shopDetail: id })
                .populate({
                    path: "variant",
                });

            return reply.send({
                data: variants,
                message: "success"
            });
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: "Internal Server Error" });
        }
    });

    // POST route to add or update variants
    fastify.post('/add-variant', async (request, reply) => {
        try {
            const variants = request.body;

            if (!Array.isArray(variants)) {
                return reply.send({ message: 'Invalid input, expected an array of variants.' });
            }

            for (const variant of variants) {
                variant.discount = parseInt(((variant.orginal_price - variant.sale_price) / variant.orginal_price) * 100);
                if (isNaN(variant.discount)) variant.discount = 0;
                await shopProductVariantModel.updateOne(
                    { sku: variant.sku },
                    { $set: variant },
                    { upsert: true }
                );
            }

            return reply.send({
                data: true,
                message: "success added"
            });
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: "Internal Server Error" });
        }
    });

    fastify.post("/variant-images", async (req, reply) => {
        try {
            const part = await req.file();
            const image_url = await fileService.photoUpload({ part })
            const newdata = await new fileModel({ image_url }).save()
            return reply.send(newdata.image_url)
    
        } catch (error) {
            console.log(error);
            reply.code(500).send(error.message)
    
        }
    })
    
    fastify.delete("/variant-images/:id", async (req, reply) => {
        try {
            const { id } = req.params;
            const file = await fileModel.findById(id);
            await fileService.remove(file.image_url)
            const deleted = await fileModel.findByIdAndDelete(file._id);
            return reply.send(deleted)
        } catch (error) {
            console.log(error);
            reply.code(500).send(error.message)
    
        }
    })


}


module.exports = shopVariantRoutes;
