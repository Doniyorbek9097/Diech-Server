const productVariantModel = require("../../models/varinat.model");
const slugify = require("slugify")
const path = require("path")
const fs = require("fs")
const { baseDir } = require("../../config/uploadFolder");
const { Base64ToFile } = require("../../utils/base64ToFile")
const fileService = require("../../services/file.service");

const variantRoutes = async(fastify, options) => {
try {
    // GET /get-product-variants/:product_id
fastify.get('/get-product-variants/:product_id', async (req, reply) => {
    try {
        const { product_id } = req.params;
        const variants = await productVariantModel.find({ product_id }).lean();
        return reply.send(variants);
    } catch (error) {
        console.log(error);
        return reply.status(500).send('Serverda Xatolik');
    }
});

// POST /add-variant
fastify.post('/add-variant', async (req, reply) => {
    try {
        const variants = await productVariantModel.insertMany(req.body);
        return reply.send({
            data: variants,
            message: 'success updated',
        });
    } catch (error) {
        console.log(error);
        return reply.status(500).send('Serverda Xatolik');
    }
});

// PUT /update-variant/:id
fastify.put('/update-variant/:id', async (req, reply) => {
    const { id } = req.params;
    let variant = req.body;
    variant.sku = slugify(`${variant.sku}`);

    // Fayl yuklash jarayoni
    for (const attr of variant.attributes) {
        if (attr?.images?.length) {
            attr.images = await fileService.upload(req, attr.images);
        }
    }

    try {
        const updated = await productVariantModel.findOneAndUpdate({ _id: id }, variant, { new: true });
        return reply.send({
            data: updated,
            message: 'success updated',
        });
    } catch (error) {
        console.log(error);

        // Xatolik yuz bersa, yuklangan rasmlarni o'chirish
        for (const attr of variant.attributes) {
            if (attr?.images?.length) {
                await fileService.remove(attr.images);
            }
        }

        return  reply.status(500).send('Serverda Xatolik');
    }
});

// DELETE /variant-delete/:id
fastify.delete('/variant-delete/:id', async (req, reply) => {
    try {
        const { id } = req.params;
        const deleted = await productVariantModel.findOneAndDelete({ _id: id });

        // O'chirilgan variantning rasmlarini o'chirish
        for (const attr of deleted.attributes) {
            if (attr?.images?.length) {
                await fileService.remove(attr.images);
            }
        }

        return reply.send({
            message: 'success deleted',
            data: deleted,
        });
    } catch (error) {
        console.log(error);
        return reply.status(500).send('Serverda Xatolik');
    }
});
} catch (error) {
   console.log(error); 
}

}


module.exports = variantRoutes;
