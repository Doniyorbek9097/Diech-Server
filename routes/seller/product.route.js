const mongoose = require("mongoose")
const productModel = require("../../models/product.model");
const shopProductModel = require("../../models/shop.product.model");
const shopProductVariantModel = require("../../models/shop.product.variant.model");
const { checkToken } = require("../../middlewares/authMiddleware");
const { algolia } = require("../../config/algolia");
const slugify = require("slugify");
const { generateOTP } = require("../../utils/otpGenrater");
const fieldModel = require("../../models/field.model");

const productsIndex = algolia.initIndex("ShopProducts");

async function productRoutes(fastify, options) {
    // Create new Product
    fastify.post("/product-add", { preHandler: checkToken }, async (req, reply) => {
        try {
          let products = req.body;
          if (Array.isArray(products)) {
            // Process each product item asynchronously
            products = await Promise.all(products.map(async (item) => {
              const product = await productModel.findById(item.parent).lean();
              if (product) {
                const { _id, ...productData } = product;
      
                // Yangi _id yarating
                const newId = new mongoose.Types.ObjectId()
      
                // Slugni yaratish
                item.slug = slugify(`${productData.name.uz.slice(0, 8)}-${newId.toString()}`);
      
                // Discountni hisoblash
                item.discount = parseInt(((item.orginal_price - item.sale_price) / item.orginal_price) * 100);
                if (isNaN(item.discount)) item.discount = 0;
                // Yangi _idni mahsulotga qo'shish
                item._id = newId;
                
                return {
                  ...productData,
                  ...item,
                };
              }
              // Agar product topilmasa, undefined qaytariladi
              return null;
            }));
      
            // Filtrlangan mahsulotlar (null bo'lmaganlar)
            products = products.filter(product => product !== null);
          }
      
          // Mahsulotlarni saqlash
          const newProduct = await shopProductModel.insertMany(products);
          return reply.status(200).send({ data: newProduct, message: "success added" });
      
        } catch (error) {
          console.error(error);
          return reply.status(500).send("Serverda Xatolik");
        }
      });


      fastify.get("/random", async (req, reply) => {
        try {
          // Mahsulotlarning faqat `_id` larini olish
          const products = await shopProductModel.find().select("_id");
      
          // Bulk yangilash uchun operatsiyalar ro'yxatini tuzamiz
          const bulkOps = products.map(product => ({
            updateOne: {
              filter: { _id: product._id }, // Qaysi mahsulotni yangilash
              update: { $set: { position: Math.floor(Math.random() * 1000000) } } // Tasodifiy `position`
            }
          }));
      
          // Bulk yangilash
          await shopProductModel.bulkWrite(bulkOps);
      
          console.log("Success");
          reply.send({ success: true });
      
        } catch (error) {
          console.error(error);
          reply.code(500).send({ success: false, error: error.message });
        }
      });

      
    // Get all products with pagination and search
    fastify.get("/product-all", async (req, reply) => {
        try {
            const { shop_id } = req.query;
            const search = req.query.search || "";
            const page = Math.max(0, (parseInt(req.query.page, 10) || 1) - 1);
            const limit = parseInt(req.query.limit, 10) || 10; // Default limit 10

            const query = { shop: shop_id };
            if (search) {
                const regex = new RegExp(search, 'i'); // 'i' flagi case-insensitive qidiruvni belgilaydi
                query.$or = [
                    { 'name.uz': regex },
                    { 'name.ru': regex },
                    { 'barcode': regex },
                ];
            }

            const totalDocuments = await shopProductModel.countDocuments(query);
            const totalPages = Math.ceil(totalDocuments / limit);

            const products = await shopProductModel.find(query)
                .skip(page * limit)
                .limit(limit)
                .sort({ _id: -1 });

            return reply.send({
                message: "success get products",
                products,
                limit,
                page: page + 1, // Mijozlar uchun sahifa 1-dan boshlanishi
                totalPages
            });

        } catch (error) {
            console.error(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // Get all search products (limited to 5)
    fastify.get("/custom-products", async (req, reply) => {
        try {
            const { search } = req.query;
            let query = {};
            if (search) {
                query = {
                    $or: [
                        { 'name.uz': { $regex: search, $options: "i" } },
                        { 'name.ru': { $regex: search, $options: "i" } },
                        { 'barcode': { $regex: search, $options: "i" } },
                    ]
                };
            }

            const products = await productModel.find(query)
                .populate("variants")
                .limit(5)
                .lean();

            return reply.send(products);

        } catch (error) {
            console.error(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // Get single product by barcode
    fastify.get('/custom-product', async (req, reply) => {
        try {
            const barcode = req.query?.barcode;
            if (!barcode) {
                return reply.status(400).send({ message: "Barcode kerak" });
            }

            const product = await productModel.findOne({ barcode });
            if (!product) {
                return reply.send({ message: "Mahsulot topilmadi" });
            }

            return reply.send({
                data: product,
                message: "Success"
            });
        } catch (error) {
            console.error(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // Get one product by ID
    fastify.get("/product-id/:id", { preHandler: checkToken }, async (req, reply) => {
        try {
            const product = await shopProductModel.findById(req.params.id)
                .populate("categories")
                .lean();

            if (!product) {
                return reply.status(404).send({ message: "Mahsulot topilmadi" });
            }

            return reply.status(200).send(product);
        } catch (error) {
            console.error(error);
            return reply.status(500).send("Server Ishlamayapti");
        }
    });

    // Update product
    fastify.put("/product-edit/:id", { preHandler: checkToken }, async (req, reply) => {
        try {
            const { id } = req.params;
            let product = req.body;

            product.slug = slugify(`${product.name.ru} ${generateOTP(30)}`);
            product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
            if (isNaN(product.discount)) product.discount = 0;

            const updatedProduct = await shopProductModel.findByIdAndUpdate(id, product, { new: true });

            if (!updatedProduct) {
                return reply.status(404).send({ message: "Mahsulot topilmadi" });
            }

            return reply.status(200).send({ data: updatedProduct, message: "success updated" });

        } catch (error) {
            console.error(error);
            return reply.status(500).send("serverda Xatolik");
        }
    });

    // Delete product
    fastify.delete("/product-delete/:id", { preHandler: checkToken }, async (req, reply) => {
        try {
            const deleted = await shopProductModel.findByIdAndDelete(req.params.id).populate('variants');
            if (!deleted) {
                return reply.status(404).send({ message: "Mahsulot topilmadi" });
            }

            if (deleted.variants && deleted.variants.length > 0) {
                for (const variant of deleted.variants) {
                    await shopProductVariantModel.deleteMany({ _id: variant._id });
                }
            }

            return reply.status(200).send({ message: "success deleted!", data: deleted });

        } catch (error) {
            console.error(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // Index products to Algolia
    fastify.get('/indexed', async (req, reply) => {
        try {
            const products = await shopProductModel.find().populate('product').lean();

            const body = products.map((item) => ({
                objectID: item._id.toString(),
                name_uz: item?.product?.name?.uz,
                name_ru: item?.product?.name?.ru,
                keywords_uz: item?.product?.keywords?.uz,
                keywords_ru: item?.product?.keywords?.ru,
                barcode: item?.product?.barcode,
                shop_id: item.shop.toString()
            }));

            await productsIndex.saveObjects(body);
            return reply.send("Indeksatsiya qilindi");
        } catch (error) {
            console.error('Indeksatsiya xatosi:', error);
            return reply.status(500).send("Indeksatsiya xatosi: " + error.message);
        }
    });

    // Replace fields in shopProductModel based on productModel
    fastify.get('/replace', async (req, reply) => {
        try {
            const products = await productModel.find().lean();
            let totalModifiedCount = 0;

            for (const product of products) {
                const { _id, ...productData } = product;
                const result = await shopProductModel.updateMany(
                    { product: product._id },
                    {
                        $rename: { product: "parent" },
                        $set: {
                            ...productData,
                            description: product.discription, // Agar 'discription' to'g'ri bo'lsa, davom eting
                            slug: slugify(`${product.name.ru} ${generateOTP(30)}`)
                        }
                    }
                );

                totalModifiedCount += result.modifiedCount;
            }

            return reply.status(200).send(`Fields renamed successfully. Modified count: ${totalModifiedCount}`);
        } catch (error) {
            console.error(error);
            return reply.status(500).send('An error occurred');
        }
    });

    // Replace specific fields in shopProductModel based on productModel
    fastify.get('/replaced', async (req, reply) => {
        try {
            const products = await productModel.find().select('_id name images attributes').lean();
            let totalUpdated = 0;

            for (const item of products) {
                const result = await shopProductModel.updateOne(
                    { parent: item._id },
                    {
                        $set: {
                            name: item.name,
                            attributes: item.attributes,
                            images: item.images
                        }
                    }
                );
                if (result.nModified > 0) {
                    totalUpdated += result.nModified;
                }
            }

            return reply.status(200).send(`Fields updated successfully. Modified count: ${totalUpdated}`);
        } catch (error) {
            console.error(error);
            return reply.status(500).send('An error occurred');
        }
    });


    fastify.get("/all-product-updated", async (req, reply) => {
        try {
            const batchSize = 100;
            let skip = 0;
            while (true) {
                const products = await shopProductModel.find({}).skip(skip).limit(batchSize).lean();
                if (products.length === 0) {
                    break;
                }
                for (const product of products) {
                    await shopProductModel.updateOne(
                        { _id: product._id },
                        { $set: { slug: slugify(`${product.name.uz.slice(0,10)}-${product._id}`) } },
                    );
                }
                skip += batchSize;
            }

            return reply.send("Success updated")
        } catch (error) {
            console.log(error);

        }
    })

}

module.exports = productRoutes;
