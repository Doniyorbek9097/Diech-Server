const slugify = require("slugify");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { baseDir } = require("../../config/uploadFolder");
const productModel = require("../../models/product.model")
const shopProductModel = require("../../models/shop.product.model")
const { algolia } = require("../../config/algolia")
const fileService = require("../../services/file.service")
const productsIndex = algolia.initIndex("products");
const sharp = require("sharp")
const { format } = require("date-fns")
const mkdirp = require("mkdirp");

const ProductImagesModel = require("../../models/product-images");
const { generateOTP } = require("../../utils/otpGenrater");

class Product {

    async add(req, reply) {
        let { body: products } = req;

        try {

            products = await Promise.all(products.map(async (product) => {
                product.slug = slugify(`${product.name.ru.toLowerCase()}`);

                if (product.barcode) {
                    const existsProduct = await productModel.findOne({ barcode: product.barcode });
                    if (existsProduct) {
                        throw new Error(`Bunday mahsulot mavjud! Barcode: ${product.barcode}`); // Throw an error to handle in catch block
                    }
                }

                return product;
            }));

            for (const product of products) {
                if (product?.images?.length) {
                    product.images = await fileService.upload(req, product?.images)
                }
            }

            // Mahsulotlarni saqlash
            const newProducts = await productModel.insertMany(products);

            return reply.send({ data: newProducts, message: "success added" });

        } catch (error) {
            console.error(error);

            // Mahsulotlar o'chirilishi
            for (const product of products) {
                if (product?.images?.length) {
                    await fileService.remove(product?.images)
                }
            }

            return reply.status(500).send({ error: error.message });
        }
    }


    async all(req, reply) {
        const search = req.query.search || "";
        const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
        const limit = parseInt(req.query.limit, 10) || 1;


        let query;
        if (search) {
            const regex = new RegExp(search, 'i'); // 'i' flagi case-insensitive qidiruvni belgilaydi
            query = {
                $or: [
                    { 'keywords.uz': { $elemMatch: { $regex: regex } } },
                    { 'keywords.ru': { $elemMatch: { $regex: regex } } },
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

            return reply.send({
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


    async oneById(req, reply) {
        try {
            let product = await productModel.findOne({ _id: req.params.id }).populate("categories").lean();
            return reply.status(200).send(product);
        } catch (error) {
            console.log(error);
            return reply.status(500).send("Server Ishlamayapti");
        }
    }


    async updateById(req, reply) {

        const { body: product } = req;

        product?.images?.length && (product.images = await fileService.upload(req, product.images).catch(err => console.log(err.message)))
        try {
            const updated = await productModel.findByIdAndUpdate(req.params.id, product);
            product?.deletedImages?.length && await fileService.remove(product?.deletedImages);
            return reply.send(updated);

        } catch (error) {
            product?.images?.length && await fileService.remove(images)
            console.log(error);
            return reply.status(500).send("Server Xatosi: " + error);
        }
    }


    async deleteById(req, reply) {
        try {
            const deleted = await productModel.findOneAndDelete({ _id: req.params.id });
            const { images } = deleted;

            images?.length && await fileService.remove(images)

            return reply.status(200).send({ result: deleted });

        } catch (error) {
            console.log(error);
            return reply.status(500).send(error.message)
        }
    }


    async indexed(req, reply) {
        const products = await shopProductModel.find().populate('variants').lean()
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
                    keywords_uz: item?.keywords?.uz,
                    keywords_ru: item?.keywords?.ru,
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
            return reply.send("Indeksatsiya qilindi")

        } catch (error) {
            console.error('Indeksatsiya xatosi:', error);
        }
    }

    async convertImagesToWebp(req, reply) {
        const products = await productModel.find({});
        for (const product of products) {
            await ProductImagesModel.updateOne({ product_id: product._id }, { $set: { images: product.images } }, { upsert: true });

            const imageUpdatePromises = product.images.map(async (imageUrl) => {
                const inputFilePath = path.basename(imageUrl);
                const baseDir = process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads" : "./uploads";
                const outputDir = process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads/images" : "./uploads/images";

                if (!fs.existsSync(outputDir)) mkdirp.sync(outputDir);

                const filePath = path.join(baseDir, inputFilePath);

                const timestamp = format(new Date(), 'dd.MM.yyyy HH-mm-ss.SSS');
                const filename = slugify(`diech_update-${timestamp}-${generateOTP(5)}.webp`);
                const outputFilePath = path.join(outputDir, filename);

                try {
                    await sharp(filePath)
                        .resize({ width: 800 })
                        .toFormat('webp')
                        .toFile(outputFilePath);

                    product.images = product.images.map(image =>
                        image === imageUrl ? `${req.protocol}://${req.headers.host}/uploads/images/${filename}` : image
                    );
                } catch (err) {
                    console.error(`Error processing file: ${inputFilePath}`, err);
                }
            });

            // Promise.all bilan barcha rasmlarni asenkron tarzda yangilash
            await Promise.all(imageUpdatePromises);

            // MongoDB'da yangilangan rasm yo'llarini saqlash
            await product.save();
        }

        console.log('All images converted and MongoDB updated.');
        return reply.send('All images converted and MongoDB updated.')
    }


async deletedImagesLink(req, reply) {
const util = require('util');
const unlinkAsync = util.promisify(fs.unlink); // fs.unlink'ni promisify qilish

    try {
        const products = await ProductImagesModel.find({}); // Asenkron kutish
        const baseDir = process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads" : "./uploads";

        // Har bir mahsulotni parallel ravishda o'chirish uchun promislarni yaratish
        const deletePromises = products.map(async (product) => {
            const imageDeletePromises = product.images.map(async (image) => {
                const filePath = path.join(baseDir, path.basename(image));
                
                try {
                    await unlinkAsync(filePath); // Asenkron faylni o'chirish
                  const result =  await ProductImagesModel.findOneAndDelete({ product_id: product.product_id }); // product_id bo'yicha o'chirish
                    console.log(`${image} deleted`);
                } catch (error) {
                    console.error(`Error deleting image ${image}:`, error);
                }
            });

            // Har bir mahsulotning barcha rasmlari uchun promislarni parallel ravishda bajarish
            return Promise.all(imageDeletePromises);
        });

        // Barcha mahsulotlar uchun o'chirish operatsiyalarini parallel ravishda bajarish
        await Promise.all(deletePromises);
        return reply.send('All products and their images deleted successfully.');
    } catch (error) {
        console.error('Error deleting images:', error);
        return reply.status(500).send('Error deleting images');
    }
}


    // Fayllarni o'chirish funksiyasini chaqirish

    async deletedImages(req, reply) {
        try {
            const baseDir = process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads" : "./uploads";
            deleteFilesExceptDirectories(baseDir)
            console.log('All products and their images deleted successfully.');
            return reply.send('All products and their images deleted successfully.')

        } catch (error) {
            console.error(error);
        }
    }


   async mixed(req, reply) {
        try {
            const products = await ProductImagesModel.find();
    
            // Barcha yangilash operatsiyalarini parallel ravishda bajarish
            const updatePromises = products.map(async product =>
                await productModel.updateOne({ _id: product.product_id }, { $set: { mixed: true } })
            );
    
            // Barcha so'rovlarni parallel ravishda bajarish
            await Promise.all(updatePromises);
    
            return reply.send("success mixed true");
        } catch (error) {
            console.error(error);
            return reply.status(500).send("Error updating mixed field");
        }
    }
    
}




// Fayllarni o'chirish funksiyasi
async function deleteFilesExceptDirectories(directory) {
    // uploads papkasidagi barcha fayl va papkalarni o'qish
    fs.readdir(directory, (err, files) => {
        if (err) {
            return console.error('Unable to scan directory:', err);
        }

        // Har bir fayl va papkani tekshirish
        files.forEach(file => {
            const fullPath = path.join(directory, file);

            // Fayl yoki papka ekanligini tekshirish
            fs.stat(fullPath, (err, stats) => {
                if (err) {
                    return console.error('Unable to get stats of file:', err);
                }

                if (stats.isFile()) {
                    // Agar bu fayl bo'lsa, uni o'chirish
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            console.error(`Error deleting file ${fullPath}:`, err);
                        } else {
                            console.log(`File deleted: ${fullPath}`);
                        }
                    });
                }
            });
        });
    });
}







module.exports = new Product();