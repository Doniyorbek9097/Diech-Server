const router = require("express").Router();
const { productModel } = require("../../models/product.model");
const { shopProductModel } = require("../../models/shop.products.model");
const categoryModel = require("../../models/category.model")
const slugify = require("slugify");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { checkToken } = require("../../middlewares/authMiddleware");
const { redisClient } = require("../../config/redisDB");



// create new Product 
router.post("/product-add", checkToken, async (req, res) => {
    redisClient.FLUSHALL()

    try {
        const { parentCategory, subCategory, childCategory } = req.body;
        req.body.categories = [parentCategory, subCategory, childCategory];
        req.body.slug = slugify(`${req.body.name} ${req.body.slug}`)
        req.body.discount = parseInt(((req.body.orginal_price - req.body.sale_price) / req.body.orginal_price) * 100);

        const newProduct = await new shopProductModel(req.body).save();
        return res.status(200).json(newProduct);

    } catch (error) {
        console.log(error);
        return res.status(500).json("serverda Xatolik")
    }
});

// get all products 
router.get("/product-all", async (req, res) => {
    try {
        const { category_id, brend_id } = req.query;
        let query = {};
        if (category_id) query.categories = { $in: [category_id] };
        if (brend_id) query.brend = brend_id;
        let products = await productModel.find(query);
        if (products.length) return res.json(products);
        return res.json([])
    } catch (error) {
        console.log(error)
    }
});




// one product by id 
router.get("/product-one/:id", checkToken, async (req, res) => {
    try {
        let product = await shopProductModel.findOne({ _id: req.params.id })
            .populate("product")
        return res.status(200).json(product);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Ishlamayapti");
    }
});



// update product 
router.put("/product-edit/:id", checkToken, async (req, res) => {
    try {
        redisClient.FLUSHALL()

        const { variants } = req.body
        let product = {};
        if (variants.length) {
            variants.forEach(item => {
                item.discount = parseInt(((item.orginal_price - item.sale_price) / item.orginal_price) * 100);
            })
            product = {
                ...req.body,
                orginal_price: variants[0].orginal_price,
                sale_price: variants[0].sale_price,
                inStock: variants[0].inStock,
                discount: variants[0].discount,
                soldOut: variants[0].soldOut,
                soldOutCount: variants[0].soldOutCount,
                returned: variants[0].returned,
                returnedCount: variants[0].returnedCount
            };
        
        } else {
            product = { ...req.body };
        }


        product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
        const updated = await shopProductModel.findByIdAndUpdate(req.params.id, product);
        await updated.save();
        res.status(200).json(updated);

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Xatosi: " + error);

    }
});



router.delete("/product-delete/:id", checkToken, async (req, res) => {
    try {
        redisClient.FLUSHALL()
        
        const deleted = await shopProductModel.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "success deleted!", data: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});


module.exports = router;



