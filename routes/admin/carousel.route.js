const carouselModel = require("../../models/carousel.model");
const slugify = require("slugify");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { Base64ToFile } = require("../../utils/base64ToFile");
const router = require("express").Router();

router.post("/carousel", async(req, res)=> {
    const { image, slug } = req.body;
    req.body.slug = slugify(slug);
    image && (req.body.image.uz = await new Base64ToFile(req).bufferInput(req.body.image.uz).save());
    image && (req.body.image.ru = await new Base64ToFile(req).bufferInput(req.body.image.ru).save());

    try {        
        const result = await new carouselModel(req.body).save();
        return res.json({
            data: result,
            message:"Success"
        });

    } catch (error) {
        console.log(error);
         const { image } = req.body;
            if(image && image.uz) {
                fs.unlink(
                    path.join(__dirname, `../../uploads/${path.basename(image.uz)}`),
                    (err) => err && console.log(err)
                )
            }

            if(image && image.ru) {
                fs.unlink(
                    path.join(__dirname, `../../uploads/${path.basename(image.uz)}`),
                    (err) => err && console.log(err)
                )
            }


            res.status(500).json(error.message);

        }
});


router.get("/carousel", async(req,res) => {
    try {       
        let result = await carouselModel.find();
       return res.json({
         data: result,
         message:"Success"
       });

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message)
    }
});


router.delete("/carousel/:id", async(req,res) => {
    try {
        console.log(req.params.id)
        if(!mongoose.isValidObjectId(req.params.id)) 
        return res.json({
            message: "Carousel topilmadi"
        });
        
        const result = await carouselModel.findByIdAndDelete(req.params.id);

        if(!result) 
        return res.json({
            message: "Carousel Topilmadi"
        });

        const { image } = result.toObject();

        if(image && image.uz) {
            fs.unlink(
                path.join(__dirname, `../../uploads/${path.basename(image.uz)}`),
                (err) => err && console.log(err)
            )
        }

        if(image && image.ru) {
            fs.unlink(
                path.join(__dirname, `../../uploads/${path.basename(image.ru)}`),
                (err) => err && console.log(err)
            )
        }


        res.json({
            data: result,
            message:"Success"
        });

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
})


module.exports = router;