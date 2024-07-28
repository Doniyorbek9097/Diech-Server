const router = require("express").Router();
const productVariantModel = require("../../models/product.varinat.model");
const slugify = require("slugify")
const path = require("path")
const fs = require("fs")
const { baseDir } = require("../../config/uploadFolder");
const { Base64ToFile } = require("../../utils/base64ToFile")


router.get("/get-product-variants/:product_id", async (req, res) => {
    try {
        const { product_id } = req.params;
        const variants = await productVariantModel.find({ product_id })

        res.json(variants)
    } catch (error) {
        console.log(error)
    }
})

router.post("/add-variant", async (req, res) => {
    try {
        const variants = await productVariantModel.insertMany(req.body)
        res.json({
            data: variants,
            message: "success updated"
        })

    } catch (error) {
        console.log(error)
    }
})


router.put("/update-variant/:id", async (req, res) => {
    const { id } = req.params;
    let variant = req.body
    variant.sku = slugify(`${variant.sku}`);
    console.log("ddd");
    for (const attr of variant.attributes) {
        if (attr.images) {
            let images = [];
            for (const image of attr?.images) {
                const data = await new Base64ToFile(req).bufferInput(image).save();
                images.push(data)
            }

            attr.images = images;
        }

    }

    try {
        const updated = await productVariantModel.findOneAndUpdate({ _id: id }, req.body)
        res.json({
            data: updated,
            message: "success updated"
        })

    } catch (error) {
        console.log(error)
        for (const attr of variant.attributes) {
            if (attr?.images?.length) {
                for (const image of attr?.images) {
                    const imagePath = path.join(__dirname, `${baseDir}/${path.basename(image)}`);
                    fs.unlink(imagePath, (err) => err && console.log(err))
                }
            }
        }



    }
})


router.delete("/variant-delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await productVariantModel.findOneAndDelete({ _id: id })
        for (const attr of deleted.attributes) {
            if (attr?.images?.length) {
                for (const image of attr?.images) {
                    const imagePath = `${baseDir}/${path.basename(image)}`;
                    fs.unlink(imagePath, (err) => err && console.log(err))
                }
            }
        }
        
        res.json({
            message: "success deleted",
            data: deleted
        })
    

    } catch (error) {
        console.log(error)
    }
})


module.exports = router
