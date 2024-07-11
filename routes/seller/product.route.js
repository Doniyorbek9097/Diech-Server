const router = require("express").Router();
const { productModel } = require("../../models/product.model");
const { shopProductModel, shopVariantsModel, attributeModel } = require("../../models/shop.products.model");
const categoryModel = require("../../models/category.model")
const slugify = require("slugify");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { checkToken } = require("../../middlewares/authMiddleware");
const { redisClient } = require("../../config/redisDB");
const { generateOTP } = require("../../utils/otpGenrater");



// create new Product 
router.post("/product-add", checkToken, async (req, res) => {
    redisClient.FLUSHALL()
    try {
        const {body: products} = req; 

        if (Array.isArray(products)) {
            for (const product of products) {
                product.slug = slugify(`${generateOTP(20)}`)
                product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
                if (isNaN(product.discount)) product.discount = 0;
            }
        }
        
        const newProduct = await shopProductModel.insertMany(products)
        return res.status(200).json({data: newProduct, message:"success added"});

    } catch (error) {
        console.log(error);
        return res.status(500).json("serverda Xatolik")
    }
});

// get all products 
router.get("/product-all", async (req, res) => {
    try {
        const { shop_id } = req.query;
        let products = await shopProductModel.find({shop: shop_id})
        .populate("product")

        res.json(products);

    } catch (error) {
        console.log(error)
    }
});


// get all search products 
router.get("/custom-products", async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = {
                $or: [
                    { 'name.uz': { $regex: search, $options: "i" } }, // name maydoni bo'yicha qidirish
                    { 'name.ru': { $regex: search, $options: "i" } }, // name maydoni bo'yicha qidirish
                    { 'barcode': { $regex: search, $options: "i" } },
                    { 'keywords': { $regex: search, $options: "i" } }, // keywords maydoni bo'yicha qidirish
                ]
            };
        }

        let products = await productModel.find(query)
        .limit(5)
        res.json(products);

    } catch (error) {
        console.log(error)
    }
});



// one product by id 
router.get("/product-one/:id", checkToken, async (req, res) => {
    try {
        let product = await shopProductModel.findOne({ _id: req.params.id })
            .populate({
              path:"product",
              populate: {
                path:"attributes",
                populate: [
                    {
                        path:"option",
                        select:["label"]
                    },
                    {
                        path:"options.option",
                        select:["label", "images"]

                    },
                   
                ]
              }   
            })
            
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

        const deleted = await shopProductModel.findByIdAndDelete(req.params.id).populate('variants')
        for (const variant of deleted.variants) {
           await shopVariantsModel.deleteMany({_id: variant._id})
        }
        
        return res.status(200).json({ message: "success deleted!", data: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});



module.exports = router;



