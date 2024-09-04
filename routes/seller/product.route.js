const router = require("express").Router();
const productModel = require("../../models/product.model");
const shopProductModel = require("../../models/shop.product.model");
const shopProductVariantModel = require("../../models/shop.product.variant.model")
const { checkToken } = require("../../middlewares/authMiddleware");
const { algolia } = require("../../config/algolia");
const productsIndex = algolia.initIndex("ShopProducts");
const slugify = require("slugify")
const { generateOTP } = require("../../utils/otpGenrater");
const fieldModel = require("../../models/field.model")


// create new Product 
router.post("/product-add", checkToken, async (req, res) => {
    try {
        let { body: products } = req;


        if (Array.isArray(products)) {
            products = await Promise.all(products.map(async (item) => { // Promise.all bilan map ichidagi async funktsiyani kutish
            
                const product = await productModel.findById(item.parent).lean();
                if (product) {
                    const { _id, ...productData } = product;
                    item.slug = slugify(`${product.name.ru} ${generateOTP(30)}`);
                    item.discount = parseInt(((item.orginal_price - item.sale_price) / item.orginal_price) * 100);

                    if (isNaN(item.discount)) item.discount = 0;

                    return {
                        products: [{
                            ...productData,
                            ...item,
                        }],
                        variants: [{
                            
                        }]
                    };;
                }

            }));
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

        const query = { shop: shop_id };
        if (search) {
            const regex = new RegExp(search, 'i'); // 'i' flagi case-insensitive qidiruvni belgilaydi
            query.$or = [
                { 'name.uz': regex },
                { 'name.ru': regex },
                { 'barcode': regex },
            ]
        }


        const totalDocuments = await shopProductModel.countDocuments(query)
        const totalPages = Math.ceil(totalDocuments / limit);

        let products = await shopProductModel.find(query)
            .skip(page * limit)
            .limit(limit)
            .sort({ _id: -1 })


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
            .populate("variants")
            .limit(5)
            .lean()

        res.json(products);

    } catch (error) {
        console.log(error)
    }
});


router.get('/custom-product', async (req, res) => {
    const barcode = req.query?.barcode;
    const product = await productModel.findOne({ barcode })
    if (!product) return res.json({ message: "Mahsulot topilmadi" })

    return res.json({
        data: product,
        message: "Success"
    })
})


// one product by id 
router.get("/product-id/:id", checkToken, async (req, res) => {
    try {
        let product = await shopProductModel.findOne({ _id: req.params.id })
            .populate("categories").lean();

        return res.status(200).json(product);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Ishlamayapti");
    }
});



// update product 
router.put("/product-edit/:id", checkToken, async (req, res) => {
    try {
        const { id } = req.params;
        let { body: product } = req;
        product.slug = slugify(`${product.name.ru} ${generateOTP(30)}`);
        product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
        if (isNaN(product.discount)) product.discount = 0;

        const newProduct = await shopProductModel.findByIdAndUpdate(id, product)
        return res.status(200).json({ data: newProduct, message: "success added" });

    } catch (error) {
        console.log(error);
        return res.status(500).json("serverda Xatolik")
    }
});



router.delete("/product-delete/:id", checkToken, async (req, res) => {
    try {
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


router.get('/replace', async (req, res) => {
    try {
        const products = await productModel.find().lean();
        let totalModifiedCount = 0;
        for (const product of products) {
            const { _id, ...productData } = product;
            const result = await shopProductModel.updateMany({ product: product._id }, {
                $rename: {
                    product: "parent"
                },
                $set: {
                    ...productData,
                    description: product.discription,
                    slug: slugify(`${product.name.ru} ${generateOTP(30)}`)
                }
            });

            totalModifiedCount += result.modifiedCount;
        }

        res.status(200).send(`Fields renamed successfully. Modified count: ${totalModifiedCount}`);
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred');
    }
});


router.get('/replaced', async (req, res) => {
    try {
        const products = await productModel.find().select('_id name images attributes').lean();

        for (const item of products) {
            await shopProductModel.updateOne({ parent: item._id }, {
                $set: {
                    name: item.name,
                    attributes: item.attributes,
                    images: item.images
                }
            })
        }


        res.status(200).send(`Fields renamed successfully. Modified `);
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred');
    }
});



module.exports = router;



