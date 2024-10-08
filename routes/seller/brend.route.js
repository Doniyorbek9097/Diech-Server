const slugify = require("slugify");
const brendModel = require("../../models/brend.model");
const { Base64ToFile } = require("../../utils/base64ToFile");
const fs = require("fs");
const path = require("path");


const brendRoutes = async(fastify, options) => {

// Get all brends
fastify.get("/brends", async (req, reply) => {
    try {
        let brends = await brendModel.find().populate("products");
        reply.status(200).send(brends);
    } catch (error) {
        console.log(error);
        reply.status(500).send(`server xatosi: ${error.message}`);
    }
});

// Create a new brend
fastify.post("/brend", async (req, reply) => {
    req.body.image.uz = await new Base64ToFile(req).bufferInput(req.body.image.uz).save();
    req.body.image.ru = await new Base64ToFile(req).bufferInput(req.body.image.ru).save();
    req.body.logo = await new Base64ToFile(req).bufferInput(req.body.logo).save();
    req.body.slug = slugify(req.body.name);

    try {
        const newBrend = await new brendModel(req.body).save();
        reply.status(201).send(newBrend);
    } catch (error) {
        console.log(error);
        const { image, logo } = req.body;
        image && fs.unlink(path.join(__dirname, "../uploads", path.basename(image)), (err) => err && console.log(err));
        logo && fs.unlink(path.join(__dirname, path.basename(logo)), (err) => err && console.log(err));
        reply.status(500).send("Serverda Xatolik");
    }
});

// Get brend by slug
fastify.get("/brend-slug/:slug", async (req, reply) => {
    try {
        const { slug } = req.params;
        let brend = await brendModel.findOne({ slug }).populate("categories", "name image slug").populate("products").populate("carousel", "image slug");
        reply.status(200).send(brend);
    } catch (error) {
        console.log(error);
        reply.status(500).send("Serverda Xatolik");
    }
});

// Get brend by ID
fastify.get("/brend/:id", async (req, reply) => {
    try {
        const { id } = req.params;
        let brend = await brendModel.findOne({ _id: id }).populate("categories", "name image slug").populate("products");
        reply.status(200).send(brend.toObject());
    } catch (error) {
        console.log(error);
        reply.status(500).send("Serverda Xatolik");
    }
});

// Update brend by ID
fastify.put("/brend/:id", async (req, reply) => {
    const { id } = req.params;
    const brend = await brendModel.findOne({ _id: id });

    if (!req.body.image.uz) fs.unlink(path.join(__dirname, `../uploads/${path.basename(brend.image.uz)}`), (err) => err && console.log(err.message));
    req.body.image.uz = await new Base64ToFile(req).bufferInput(req.body?.image?.uz).fileName(brend.image.uz).save();

    if (!req.body.image.ru) fs.unlink(path.join(__dirname, `../uploads/${path.basename(brend.image.ru)}`), (err) => err && console.log(err.message));
    req.body.image.ru = await new Base64ToFile(req).bufferInput(req.body?.image?.ru).fileName(brend.image.ru).save();

    if (!req.body.logo) fs.unlink(path.join(__dirname, `../uploads/${path.basename(brend.logo)}`), (err) => err && console.log(err.message));
    req.body.logo = await new Base64ToFile(req).bufferInput(req.body?.logo).fileName(brend.logo).save();

    req.body.slug = slugify(req.body.name);

    try {
        const newBrend = await brendModel.findOneAndUpdate({ _id: id }, req.body, { new: true });
        reply.status(200).send(newBrend.toObject());
    } catch (error) {
        console.log(error);
        const { image, logo } = req.body;
        image?.uz && fs.unlink(path.join(__dirname, "../uploads", path.basename(image.uz)), (err) => err && console.log(err));
        image?.ru && fs.unlink(path.join(__dirname, "../uploads", path.basename(image.ru)), (err) => err && console.log(err));
        logo && fs.unlink(path.join(__dirname, path.basename(logo)), (err) => err && console.log(err));
        reply.status(500).send("Serverda Xatolik");
    }
});

// Delete brend by ID
fastify.delete("/brend/:id", async (req, reply) => {
    try {
        const deleteBrend = await brendModel.findByIdAndDelete(req.params.id);
        const { image, logo } = deleteBrend;
        image?.uz && fs.unlink(path.join(__dirname, `../uploads/${path.basename(image.uz)}`), (err) => err && console.log(err));
        image?.ru && fs.unlink(path.join(__dirname, `../uploads/${path.basename(image.ru)}`), (err) => err && console.log(err));
        logo && fs.unlink(path.join(__dirname, `../uploads/${path.basename(logo)}`), (err) => err && console.log(err));
        reply.status(200).send("Successfully deleted!");
    } catch (error) {
        console.log(error);
        reply.status(500).send("Server xatosi: " + error.message);
    }
});

}


module.exports = brendRoutes;
