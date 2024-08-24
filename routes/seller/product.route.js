const router = require("express").Router();
const productModel = require("../../models/product.model");
const shopProductModel = require("../../models/shop.product.model");
const shopProductVariantModel = require("../../models/shop.product.variant.model")
const { checkToken } = require("../../middlewares/authMiddleware");
const { redisClient } = require("../../config/redisDB");
const { algolia } = require("../../config/algolia");
const productsIndex = algolia.initIndex("ShopProducts");



// create new Product 
router.post("/product-add", checkToken, async (req, res) => {
    redisClient.FLUSHALL()
    try {
        const { body: products } = req;
        if (Array.isArray(products)) {
            for (const product of products) {
                product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
                if (isNaN(product.discount)) product.discount = 0;
            }
        }

        const newProduct = await shopProductModel.insertMany(products)
        return res.status(200).json({ data: newProduct, message: "success added" });

    } catch (error) {
        console.log(error);
        return res.status(500).json("serverda Xatolik")
    }
});

// get all products 
router.get("/product-all", async (req, res) => {
    try {
        const { shop_id } = req.query;
        const search = req.query.search || "";
        const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
        const limit = parseInt(req.query.limit, 10) || 1;

        const options = { page, hitsPerPage: limit, filters: `shop_id:${shop_id}` };
        const query = {};

        const { hits } = await productsIndex.search(search || '', options)

        const ids = hits.map(item => item.objectID)
        query._id = { $in: ids };

        const totalDocuments = await shopProductModel.countDocuments(query)
        const totalPages = Math.ceil(totalDocuments / limit);

        let products = await shopProductModel.find(query)
            .populate({
                path: "product",
            })
            .sort({ _id: -1 })

        products = products.filter(item => !!item.product)

        return res.json({
            message: "success get products",
            products,
            limit,
            page,
            totalPages
        });


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


router.get('/custom-product', async (req, res) => {
    const barcode = req.query?.barcode;
    const product = await productModel.findOne({ barcode });
    if (!product) return res.json({ message: "Mahsulot topilmadi" })

    return res.json({
        data: product,
        message: "Success"
    })
})


// one product by id 
router.get("/product-one/:id", checkToken, async (req, res) => {
    try {
        let product = await shopProductModel.findOne({ _id: req.params.id })
            .populate({
                path: "product",
                populate: {
                    path: "variants",
                }
            })
            .populate({
                path: "variants",
                populate: {
                    path: "variant"
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
        let product = req.body;
        if (variants.length) {
            variants.forEach(item => {
                item.discount = parseInt(((item.orginal_price - item.sale_price) / item.orginal_price) * 100);
            })
        }

        product.variants = variants;
        product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
        const updated = await shopProductModel.findByIdAndUpdate(req.params.id, product);

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
            await shopProductVariantModel.deleteMany({ _id: variant._id })
        }

        return res.status(200).json({ message: "success deleted!", data: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});


router.get('/indexed', async (req, res) => {
    const products = await shopProductModel.find().populate('product').lean()
    try {
        const body = products.flatMap((item) => {
            return {
                objectID: item._id.toString(),  // objectID ni _id dan olish
                name_uz: item?.product?.name?.uz,
                name_ru: item?.product?.name?.ru,
                keywords_uz: item?.product?.keywords?.uz,
                keywords_ru: item?.product?.keywords?.ru,
                barcode: item?.product?.barcode,
                shop_id: item.shop.toString()
            }
        });

        await productsIndex.saveObjects(body);
        res.send("Indeksatsiya qilindi")

    } catch (error) {
        console.error('Indeksatsiya xatosi:', error);
    }

})


module.exports = router;



