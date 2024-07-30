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


const indexDocuments = async (products) => {
    // const response = await esClient.indices.delete({ index: 'products' });
    //     console.log("Indeks o'chirildi:", response);
    try {
        const body = products.flatMap((item) => {
        const variant_uz = item?.variants?.flatMap(variant => variant?.attributes?.flatMap(attr => attr.value?.uz || [])) || [];
        const variant_ru = item?.variants?.flatMap(variant => variant?.attributes?.flatMap(attr => attr.value?.ru || [])) || [];
        const attribute_uz = item?.attributes?.flatMap(attr => attr.value?.uz)
        const attribute_ru = item?.attributes?.flatMap(attr => attr.value?.ru) 
        const attributes_uz = item?.attributes?.flatMap(attr => attr?.values.flatMap(item => item.uz))
        const attributes_ru = item?.attributes?.flatMap(attr => attr?.values.flatMap(item => item.ru)) 
    
            return [
                { index: { _index: "products", _id: item._id.toString() } },
                {
                    name_uz: item?.name?.uz,
                    name_ru: item?.name?.ru,
                    keywords_uz: item?.keyword?.uz,
                    keywords_ru: item?.keyword?.ru,
                    variant_uz: variant_uz,
                    variant_ru: variant_ru,
                    attribute_uz: attribute_uz,
                    attribute_ru: attribute_ru,
                    attributes_uz,
                    attributes_ru,
                    barcode: item?.barcode
                }
            ]
        });

        await esClient.bulk({ refresh: true, body });
        console.log("Indeksatsiya qilindi");
    } catch (error) {
        console.error('Indeksatsiya xatosi:', error);
    }
};


router.get("/products-index", async (req, res) => {
    // const response = await esClient.search({
    //     index: 'products',
    //     body: {
    //         from: 0,
    //         size: 20,
    //         query: {
    //             match_all: {} // You can customize this query as needed
    //         }
    //     }
    // });

    // console.log(response.hits.hits);
    const products = await productModel.find()
    .populate({
        path:"variants",
    }).lean()

    await indexDocuments(products);
    res.send("mahsulotlar indexlandi")

})

router.post("/product-add", checkToken, async (req, res) => {
    try {
        // Redis'ni tozalash
        await redisClient.FLUSHALL();

        const { body: products } = req;

        const processedProducts = await Promise.all(products.map(async (product) => {
            if (product?.images?.length) {
                product.images = await Promise.all(product.images.map(async (image) => {
                    const data = await new Base64ToFile(req).bufferInput(image).save();
                    return data;
                }));
            }

            product.slug = slugify(`${product.name.ru.toLowerCase()}`);

            if (product.barcode) {
                const existsProduct = await productModel.findOne({ barcode: product.barcode });
                if (existsProduct) {
                    throw new Error(`Bunday mahsulot mavjud! Barcode: ${product.barcode}`); // Throw an error to handle in catch block
                }
            }

            return product;
        }));

        // Mahsulotlarni saqlash
        const newProducts = await productModel.insertMany(processedProducts);
        res.json({ data: newProducts, message: "success added" });

    } catch (error) {
        console.error(error);

        // Mahsulotlar o'chirilishi
        for (const product of req.body) {
            if (product?.images?.length) {
                await Promise.all(product.images.map(async (image) => {
                    const imagePath = path.join(__dirname, `${baseDir}/${path.basename(image)}`);
                    fs.unlink(imagePath, (err) => err && console.log(err));
                }));
            }
        }

        res.status(500).json({ message: "serverda Xatolik", error: error.message });
    }
});


// get all products 
router.get("/product-all", checkToken, async (req, res) => {
    
    // await productModel.updateMany(
    //     {},
    //     { $unset: { keywords: "" } }
    // );

    const search = req.query.search || "";
    const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
    const limit = parseInt(req.query.limit, 10) || 1;
    

    let query;
    if (search) {
        const regex = new RegExp(search, 'i'); // 'i' flagi case-insensitive qidiruvni belgilaydi
        query = {
            $or: [
                { 'keywords': { $elemMatch: { $regex: regex } } },
                { 'name.uz': regex },
                { 'name.ru': regex },
                { 'barcode': regex }
            ]
        };
    }

    const totalDocuments = await productModel.countDocuments(query).exec()
    const totalPages = Math.ceil(totalDocuments / limit);

    try {
        let products = await productModel.find(query)
            .populate("variants")
            .skip(page * limit)
            .limit(limit)
            .sort({ _id: -1 })

        products = products.map(product => {
            const sold = product.variants.length ? product.variants.reduce((count, item) => count += item.soldOutCount, 0) : product.soldOutCount;
            const sold_variants = product.variants.reduce((acc, item) => acc.concat({ sku: item.sku, count: item.soldOutCount }), []);
            const returned = product.variants.length ? product.variants.reduce((count, item) => count += item.returnedCount, 0) : product.returnedCount;
            const returned_variants = product.variants.reduce((acc, item) => acc.concat({ sku: item.sku, count: item.returnedCount }), []);
            const views = product.viewsCount;
            return {
                _id: product._id,
                image: product?.images?.length ? product?.images[0] : "",
                name: product.name,
                barcode: product?.barcode,
                sold,
                sold_variants,
                returned,
                returned_variants,
                views
            }
        })

        return res.json({
            message: "success get products",
            data: products,
            limit,
            page,
            totalPages
        });
    } catch (error) {
        console.log(error)
    }
});




// one product by id 
router.get("/product-one/:id", checkToken, async (req, res) => {
    try {
        let product = await productModel.findOne({ _id: req.params.id }).populate("categories")
        return res.status(200).json(product.toObject());
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Ishlamayapti");
    }
});



// update product 
router.put("/product-edit/:id", checkToken, async (req, res) => {
    await redisClient.FLUSHALL()

    const { body: product } = req;

    if (product.images.length) {
        let images = [];
        for (const image of product.images) {
            const data = await new Base64ToFile(req).bufferInput(image).save();
            images.push(data);
        }
        product.images = images;
    }


    try {

        const updated = await productModel.findByIdAndUpdate(req.params.id, product);
        if (product?.deletedImages?.length > 0) {
            product.deletedImages.forEach(element => {
                let imagePath;
                element && (imagePath = `${baseDir}/${path.basename(element)}`);
                fs.unlink(imagePath, (err) => err && console.log(err))
            });
        }

        return res.json(updated);

    } catch (error) {

        for (const image of product?.images) {
            const imagePath = path.join(__dirname, `${baseDir}/${path.basename(image)}`);
            fs.unlink(imagePath, (err) => err && console.log(err))
        }

        console.log(error);
        res.status(500).send("Server Xatosi: " + error);
    }
});



router.delete("/product-delete/:id", checkToken, async (req, res) => {
    try {
        redisClient.FLUSHALL()
        const deleted = await productModel.findOneAndDelete({ _id: req.params.id });
        const { images } = deleted;

        if (images && images?.length > 0) {
            images?.forEach(item => {
                const imagePath = `${baseDir}/${path.basename(item)}`;
                fs.unlink(imagePath, (err) => err && console.log(err))
            })
        }

        return res.status(200).json({ result: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});



module.exports = router;



