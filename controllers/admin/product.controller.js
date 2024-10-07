const slugify = require("slugify");
const { Types } = require("mongoose")
const productModel = require("../../models/product.model")
const shopProductModel = require("../../models/shop.product.model")
const fileModel = require("../../models/file.model")
const { algolia } = require("../../config/algolia")
const fileService = require("../../services/file.service2")
const productsIndex = algolia.initIndex("products");

class Product {

    async add(req, reply) {
        let { body: product } = req;
        try {
            // Mahsulot nomi mavjudligini tekshirish va slug yaratish
            if (!product.name?.ru) {
                throw new Error("Mahsulot nomi mavjud emas");
            }
            product.slug = slugify(product.name.ru.toLowerCase());
    
            // Barcode bo'yicha mahsulotni qidirish
            if (product.barcode) {
                const existsProduct = await productModel.findOne({ barcode: product.barcode });
                if (existsProduct) {
                    throw new Error(`Bunday mahsulot mavjud! Barcode: ${product.barcode}`);
                }
            }
    
            // Yangi mahsulotni saqlash
            const newProduct = await new productModel(product).save();
    
            // Tasvirlarni faollashtirish
            const updatePromises = newProduct.images.map(async item => 
                await fileModel.updateOne({ _id: item._id }, { isActive: true, owner_id: newProduct._id, owner_type:"product" })
            );
            await Promise.all(updatePromises); // Parallel bajariladi
    
            return reply.send({ data: newProduct, message: "success added" });
    
        } catch (error) {
            console.error(error);
    
            // Xato bo'lsa, rasmlarni o'chirish
            try {
                const removePromises = product.images.map(async item => {
                    await fileService.remove(item.url);
                    await fileModel.deleteOne({ _id: item._id });
                });
                await Promise.all(removePromises); // Parallel bajariladi
            } catch (cleanupError) {
                console.error("Rasmlarni o'chirishda xato: ", cleanupError);
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
                    images: product?.images,
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

    try {
        // Mahsulotni yangilash
        const updated = await productModel.findByIdAndUpdate(req.params.id, product, { new: true });

        if (!updated) {
            return reply.status(404).send({ error: "Mahsulot topilmadi" });
        }

        // Tasvirlarni faollashtirish
        const updatePromises = updated.images.map(async item => 
           await fileModel.updateOne({ _id: item._id }, { isActive: true, owner_id: newProduct._id, owner_type:"product" })
        );
        await Promise.all(updatePromises); // Parallel bajariladi

        return reply.send(updated);
    } catch (error) {
        console.error("Yangilashda xato:", error);
        
        // Xato bo'lsa, rasmlarni o'chirish
        try {
            const removePromises = product.images.map(async item => {
                await fileService.remove(item?.url);
                await fileModel.findByIdAndDelete(item._id);
            });
            await Promise.all(removePromises); // Parallel bajariladi
        } catch (cleanupError) {
            console.error("Rasmlarni o'chirishda xato:", cleanupError);
        }

        return reply.status(500).send("Server Xatosi: " + error.message);
    }
}


    async deleteById(req, reply) {
        try {
            const product = await productModel.findById(req.params.id);
            await Promise.all(product.images.map(async item => {
                try {
                    await fileService.remove(item.url)
                    await fileModel.findByIdAndDelete(item._id)
                    return "Success"
                } catch (error) {
                    throw new Error(`${error.message}`);
                }
            }))

            const deleted = await productModel.findByIdAndDelete(req.params.id);
            return reply.status(200).send({ result: deleted });

        } catch (error) {
            console.log(error);
            return reply.status(500).send(error.message)
        }
    }

    async productImage(req, reply) {
        try {
            // Barcha mahsulotlarning images arrayini tozalash
            // await shopProductModel.updateMany({}, { $set: { images: [] } });

            const files = await fileModel.find().lean()

            // File saqlashlarni to'plab, parallel ravishda bajarish uchun
            const updatePromises = files.map(file => {
                return fileModel.updateOne(
                    { _id: file._id },
                    {
                        $set: {
                           image_url: file.image.large,
                           owner_id: file.product_id,
                           owner_type: "product"
                        }
                    }
                );
            });

            // Barcha yangilanishlarni parallel ravishda bajarish
            await Promise.all(updatePromises);

            return reply.send("updated"); // Yangilanganligini qaytarish
        } catch (error) {
            console.error(error);
            reply.code(500).send({ message: "Server error" }); // Xato javob qaytarish
        }
    }


    async imageUpload(req, reply) {
        try {
            const part = await req.file();
            const image_url = await fileService.photoUpload({ part })
            const newdata = await new fileModel({ image_url }).save()
            
            return reply.send({
                _id: newdata._id,
                url: newdata.image_url
            })

        } catch (error) {
            console.log(error);
            reply.code(500).send(error.message)

        }
    }


    async imageRemove(req, reply) {
        try {
            const { id } = req.params;
            const file = await fileModel.findById(id);
            await fileService.remove(file.image_url)
            const deleted = await fileModel.findByIdAndDelete(file._id);
            return reply.send(deleted)
        } catch (error) {
            console.log(error);
            reply.code(500).send(error.message)

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

}




module.exports = new Product();