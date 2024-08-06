const slugify = require("slugify");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { redisClient } = require("../../config/redisDB");
const { baseDir } = require("../../config/uploadFolder");
const productModel = require("../../models/product.model")

const algoliasearch = require('algoliasearch')

const client = algoliasearch("RMBB59LLYA", "e7e37b7c84e383ccdca3273d784c4867");
const productsIndex = client.initIndex("products");


class Product {

    async add(req, res) {
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

            res.status(500).json({ error: error.message });
        }
    }


    async all(req, res) {
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
                .populate("owner")
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
                    views,
                    owner: product?.owner
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
    }


    async oneById(req, res) {
        try {
            let product = await productModel.findOne({ _id: req.params.id }).populate("categories")
            return res.status(200).json(product.toObject());
        } catch (error) {
            console.log(error);
            return res.status(500).send("Server Ishlamayapti");
        }
    }


    async updateById(req, res) {
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
    }


    async deleteById(req, res) {
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
    }


    async indexed(req, res) {
        const products = await productModel.find().populate('variants').lean()
        try {
            const body = products.flatMap((item) => {
                const variant_uz = item?.variants?.flatMap(variant => variant?.attributes?.flatMap(attr => attr.value?.uz || [])) || [];
                const variant_ru = item?.variants?.flatMap(variant => variant?.attributes?.flatMap(attr => attr.value?.ru || [])) || [];
                const attribute_uz = item?.attributes?.flatMap(attr => attr.value?.uz)
                const attribute_ru = item?.attributes?.flatMap(attr => attr.value?.ru)
                const attributes_uz = item?.attributes?.flatMap(attr => attr?.values.flatMap(item => item.uz))
                const attributes_ru = item?.attributes?.flatMap(attr => attr?.values.flatMap(item => item.ru))

                return {
                    objectID: item._id.toString(),  // objectID ni _id dan olish
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
            });

            await productsIndex.saveObjects(body);
            console.log("Indeksatsiya qilindi");

        } catch (error) {
            console.error('Indeksatsiya xatosi:', error);
        }

    }

}



module.exports = new Product();