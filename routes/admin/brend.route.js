const slugify = require("slugify");
const brendModel = require("../../models/brend.model");
const router = require("express").Router();
const langReplace  = require("../../utils/langReplace"); 
const { Base64ToFile } = require("../../utils/base64ToFile");
const { baseDir } = require("../../config/uploadFolder")
const fs = require("fs");
const path = require("path");


router.get("/brends", async (req, res) => {
    try {
        let brends = await brendModel.find().populate("products")
        return res.status(200).json(brends);
    } catch (error) {
        console.log(error);
        res.status(500).send(`server xatosi: ${error.message}`)
    }
});



router.post("/brend", async(req, res) => {
    req.body.image.uz = await new Base64ToFile(req).bufferInput(req.body.image.uz).save();
    req.body.image.ru = await new Base64ToFile(req).bufferInput(req.body.image.ru).save();
    req.body.logo = await new Base64ToFile(req).bufferInput(req.body.logo).save();
    req.body.slug = slugify(req.body.name);

    try {
        const newBrend = await new brendModel(req.body).save();
        return res.status(201).json(newBrend);

    } catch (error) {
        console.log(error);
        const { image, logo } = req.body;
        image && fs.unlink(`${baseDir}/${path.basename(image)}`, (err) => err && console.log(err));
        logo && fs.unlink(`${baseDir}/${path.basename(logo)}`, (err) => err && console.log(err));
    }
});



router.get("/brend-slug/:slug", async(req, res) => {
    try { 
        const { slug } = req.params;
        let brend = await brendModel.findOne({slug: slug}).populate("categories", "name image slug").populate("products").populate("carousel", "image slug");
        return res.status(200).json(brend);
    
    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik");
    }
});


router.get("/brend/:id", async(req, res) => {
    try {
        const { id } = req.params;
        let brend = await brendModel.findOne({_id: id});  
        console.log(brend.toObject())      
        return res.status(200).json(brend.toObject());
    
    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik");
    }
});


router.put("/brend/:id", async(req, res) => {
    const { id } = req.params;
    req.body.image.uz = await new Base64ToFile(req).bufferInput(req.body?.image?.uz).save();
    req.body.image.ru = await new Base64ToFile(req).bufferInput(req.body?.image?.ru).save();
    req.body.logo = await new Base64ToFile(req).bufferInput(req.body?.logo).save();
    req.body.slug = slugify(req.body.name);

    try {
        const newBrend = await brendModel.findOneAndUpdate({_id:id}, req.body);
        return res.status(200).json(newBrend.toObject());

    } catch (error) {
        console.log(error);
        const { image, logo } = req.body;
        image?.uz && fs.unlink(`${baseDir}/${path.basename(image.uz)}`, (err) => err && console.log(err));
        image?.ru && fs.unlink(`${baseDir}/${path.basename(image.ru)}`, (err) => err && console.log(err));
        logo && fs.unlink(`${baseDir}/${path.basename(logo)}`, (err) => err && console.log(err));
        res.status(500).send("Serverda Xatolik");
    }
});

router.delete("/brend/:id", async (req, res) => {
    try {
        const deleteBrend = await brendModel.findByIdAndDelete(req.params.id);
        const {image, logo} = deleteBrend;
        image?.uz && fs.unlink(`${baseDir}/${path.basename(image.uz)}`, (err) => err && console.log(err));
        image?.ru && fs.unlink(`${baseDir}/${path.basename(image.ru)}`, (err) => err && console.log(err));
        logo && fs.unlink(`${baseDir}/${path.basename(logo)}`, (err) => err && console.log(err));
        return res.status(200).json("success deleted!")
    } catch (error) {
        console.log(error);
        res.status(500).send("Server xatosi: "+ error.message);
    }
})



module.exports = router;