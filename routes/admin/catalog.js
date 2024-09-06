const router = require("express").Router()
const catalogModel = require('../../models/catalog')

const catalogRoutes = async(fastify, options) => {
    // POST /catalog-add
fastify.post('/catalog-add', async (req, reply) => {
    try {
        const catalogForm = req.body;
        const savedCatalog = await new catalogModel(catalogForm).save();
        return reply.send({
            data: savedCatalog,
            message: 'success added'
        });
    } catch (error) {
        console.log(error);
        return reply.status(500).send("Serverda xatolik");
    }
});

// GET /catalog-all
fastify.get('/catalog-all', async (req, reply) => {
    try {
        const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
        const limit = parseInt(req.query.limit, 10) || 8;

        const catalogs = await catalogModel.find()
            .populate({
                path: "products.product",
                select: ['name', 'slug', 'images', 'orginal_price', 'sale_price', 'discount', 'reviews', 'rating', 'viewsCount', 'attributes'],
                options: { limit, skip: page * limit }, // Pagination
            });

            return reply.send({
            data: catalogs,
            message: "success"
        });
    } catch (error) {
        console.log(error);
        return reply.status(500).send("Serverda xatolik");
    }
});

// DELETE /catalog-delete/:id
fastify.delete('/catalog-delete/:id', async (req, reply) => {
    try {
        const { id } = req.params;
        const deleted = await catalogModel.findOneAndDelete({ _id: id });
        return reply.send({
            message: "success deleted",
            data: deleted
        });
    } catch (error) {
        console.log(error);
        return reply.status(500).send(error.message);
    }
});

}


module.exports = catalogRoutes;