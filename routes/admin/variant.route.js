const router = require("express").Router();
const productVariantModel = require("../../models/product.varinat.model");
const slugify = require("slugify")
const path = require("path")
const fs = require("fs")
const { baseDir } = require("../../config/uploadFolder");
const { Base64ToFile } = require("../../utils/base64ToFile")
const fileService = require("../../services/file.service")

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
    for (const attr of variant.attributes) {
        attr?.images?.length && (attr.images = await fileService.upload(req, attr.images))
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
            attr?.images?.length && (attr.images = await fileService.remove(attr.images))
        }



    }
})


router.delete("/variant-delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await productVariantModel.findOneAndDelete({ _id: id })
        for (const attr of deleted.attributes) {
            attr?.images?.length && (attr.images = await fileService.remove(attr.images))
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
