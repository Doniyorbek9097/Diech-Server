const shopProductVariantModel = require("../../models/shop.product.variant.model");

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
}

module.exports = shopVariantRoutes;
