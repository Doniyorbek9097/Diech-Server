const slugify = require("slugify");
const brendModel = require("../../models/brend.model");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { baseDir } = require("../../config/uploadFolder")
const fs = require("fs");
const path = require("path");


const brendRoutes = async(fastify, options) => {

// GET /brends
fastify.get('/brends', async (req, reply) => {
    try {
        let brends = await brendModel.find().populate('products');
        return reply.status(200).send(brends);
    } catch (error) {
        console.log(error);
        return reply.status(500).send(`server xatosi: ${error.message}`);
    }
});

// POST /brend
fastify.post('/brend', async (req, reply) => {
    req.body.image.uz = await new Base64ToFile(req).bufferInput(req.body.image.uz).save();
    req.body.image.ru = await new Base64ToFile(req).bufferInput(req.body.image.ru).save();
    req.body.logo = await new Base64ToFile(req).bufferInput(req.body.logo).save();
    req.body.slug = slugify(req.body.name);

    try {
        const existsBrend = await brendModel.findOne({ slug: req.body.slug });
        if (existsBrend) {
            return reply.send({
                message: "Bunday Brend Mavjud!"
            });
        }

        const newBrend = await new brendModel(req.body).save();
        return reply.status(201).send(newBrend);
    } catch (error) {
        console.log(error);
        const { image, logo } = req.body;
        image && fs.unlink(`${baseDir}/${path.basename(image)}`, (err) => err && console.log(err));
        logo && fs.unlink(`${baseDir}/${path.basename(logo)}`, (err) => err && console.log(err));
        return reply.status(500).send(error.message);
    }
});

// GET /brend-slug/:slug
fastify.get('/brend-slug/:slug', async (req, reply) => {
    try {
        const { slug } = req.params;
        let brend = await brendModel.findOne({ slug })
            .populate('categories', 'name image slug')
            .populate('products')
            .populate('carousel', 'image slug');
            return reply.status(200).send(brend);
    } catch (error) {
        console.log(error);
        return reply.status(500).send("Serverda Xatolik");
    }
});

// GET /brend/:id
fastify.get('/brend/:id', async (req, reply) => {
    try {
        const { id } = req.params;
        let brend = await brendModel.findOne({ _id: id });
        return reply.status(200).send(brend.toObject());
    } catch (error) {
        console.log(error);
        return reply.status(500).send("Serverda Xatolik");
    }
});

// PUT /brend/:id
fastify.put('/brend/:id', async (req, reply) => {
    const { id } = req.params;
    req.body.image.uz = await new Base64ToFile(req).bufferInput(req.body?.image?.uz).save();
    req.body.image.ru = await new Base64ToFile(req).bufferInput(req.body?.image?.ru).save();
    req.body.logo = await new Base64ToFile(req).bufferInput(req.body?.logo).save();
    req.body.slug = slugify(req.body.name);

    try {
        const newBrend = await brendModel.findOneAndUpdate({ _id: id }, req.body);
        return reply.status(200).send(newBrend.toObject());
    } catch (error) {
        console.log(error);
        const { image, logo } = req.body;
        image?.uz && fs.unlink(`${baseDir}/${path.basename(image.uz)}`, (err) => err && console.log(err));
        image?.ru && fs.unlink(`${baseDir}/${path.basename(image.ru)}`, (err) => err && console.log(err));
        logo && fs.unlink(`${baseDir}/${path.basename(logo)}`, (err) => err && console.log(err));
        return reply.status(500).send("Serverda Xatolik");
    }
});

// DELETE /brend/:id
fastify.delete('/brend/:id', async (req, reply) => {
    try {
        const deleteBrend = await brendModel.findByIdAndDelete(req.params.id);
        const { image, logo } = deleteBrend;
        image?.uz && fs.unlink(`${baseDir}/${path.basename(image.uz)}`, (err) => err && console.log(err));
        image?.ru && fs.unlink(`${baseDir}/${path.basename(image.ru)}`, (err) => err && console.log(err));
        logo && fs.unlink(`${baseDir}/${path.basename(logo)}`, (err) => err && console.log(err));
        return reply.status(200).send("success deleted!");
    } catch (error) {
        console.log(error);
        return reply.status(500).send("Server xatosi: " + error.message);
    }
});

}


module.exports = brendRoutes;