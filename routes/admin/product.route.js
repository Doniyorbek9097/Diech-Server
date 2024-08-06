const router = require("express").Router();
const productModel = require("../../models/product.model");
const cartModel = require("../../models/cart.model")
const slugify = require("slugify");
const sharp = require('sharp')
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { checkToken } = require("../../middlewares/authMiddleware");
const { redisClient } = require("../../config/redisDB");
const { baseDir } = require("../../config/uploadFolder");
const { generateOTP } = require("../../utils/otpGenrater");
const { upload, resizeImages } = require("../../middlewares/upload")
const { esClient } = require("../../config/db");
const { populate } = require("../../models/category.model");
const productController = require("../../controllers/admin/product.controller")

// create new Product 
router.get("/upload/:id", async (req, res) => {
    try {
        const productId = req.params.id; // Replace with your product ID logic
        const product = await productModel.findById(productId).select("images")
        return res.json(product);

    } catch (error) {
        console.log(error);
    }
})


router.put("/upload/:id", upload.array('images', 10), async (req, res) => {
    try {
        const images = [];

        for (const file of req.files) {
            images.push(`${req.protocol}://${req.headers.host}/uploads/${file.filename}`)
        }

        const productId = req.params.id;
        const product = await productModel.findById(productId).select('images')
        product.images.push(...images)
        res.json(product.images)
        await product.save()

    } catch (error) {
        console.log(error);
    }
})



// add product 
router.post("/product-add", checkToken, productController.add);

// get all products 
router.get("/product-all", checkToken, productController.all)    

// get one by id 
router.get("/product-one/:id", checkToken, productController.oneById);

// update by id 
router.put("/product-edit/:id", checkToken, productController.updateById);

//delete by id
router.delete("/product-delete/:id", checkToken, productController.deleteById);

router.get("/product-all-indexed", checkToken, productController.indexed)


module.exports = router;



