const mongoose = require("mongoose")
const categoryModel = require("../../models/category.model");
const fieldModel = require("../../models/field.model")
const _ = require('lodash');
const shopProductModel = require("../../models/shop.product.model");
const { algolia } = require("../../config/algolia");
const productsIndex = algolia.initIndex("ShopProducts");


class Category {
    async allTree(req, reply) {
        try {

            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 8;
            const search = req.query.search || "";
            const { lang = "" } = req.headers;

            const categories = await categoryModel.find({ parent: undefined })
                .populate({
                    path: "children",
                    select: ['slug', 'name'],
                    populate: {
                        path: "children",
                        select: ['slug', 'name'],
                    }
                })
                .select("name slug icon image children")

            const data = { page: page + 1, limit, categories };

            return data;
        } catch (err) {
            console.log(err);
            return reply.status(500).send({ message: "Server is not working" });
        }
    }


    async allParent(req, reply) {
        try {

            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 8;
            const search = req.query.search || "";
            const { lang = "" } = req.headers;

            const categories = await categoryModel.find({ parent: undefined })
                .select("slug name icon")

            const data = { page: page + 1, limit, categories };

            return data;
        } catch (err) {
            console.log(err);
            return reply.status(500).send({ message: "Server is not working" });
        }
    }


    async withHome(req, reply) {
        try {
            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 8;
            const query = { showHomePage: true };

            const categories = await categoryModel.find(query)
                .skip(page * limit)
                .limit(limit)
                .sort({ updatedAt: -1 })
                .select('slug name')

            const totalDocuments = await categoryModel.countDocuments(query)
            const populatedCategories = await Promise.all(categories.map(async category => {
                const populatedCategory = await categoryModel.populate(category, [
                    {
                        path: "shop_products",
                        select: 'name orginal_price sale_price inStock slug images rating reviewsCount discount',
                        options: {
                            sort: { updatedAt: -1 },
                            limit: 10
                        }
                    },
                    {
                        path: "banners", // Bu yerda bannersni populate qilish
                    }
                ])

                return populatedCategory;

            }));

            const data = {
                totalPage: Math.ceil(totalDocuments / limit),
                page: page + 1,
                limit,
                categories: populatedCategories
            };

            return data;

        } catch (err) {
            console.log(err);
            return reply.status(500).send({ message: "Server is not working" });
        }
    }

    async oneBySlug(req, reply) {
        try {
            const slug = req.params?.slug || "";
            const page = parseInt(req.query?.page) - 1 || 0;
            const limit = parseInt(req.query?.limit) || 10;
            const search = req.query.search || "";
            const prices = req.query?.prices ? req.query.prices.split(",") : [];
            const attrs = req.query?.attrs ? req.query?.attrs.split(",") : [];
            const sortQuery = req.query.sort || "";

            let category = await categoryModel.findOne({ slug })
                .populate("banners")
                .populate({
                    path: "children",
                    select: 'image slug name icon',
                })
                .select('image slug name icon')

            if (!category) return reply.send({ error: 'Category not found' });

            let query = {};
            let sort = {};
            switch (sortQuery) {
                case "cheap":
                    sort = { sale_price: 1 }; // Narxi arzon
                    break;
                case "expensive":
                    sort = { sale_price: -1 }; // Narxi qimmat
                    break;
                case "seen":
                    sort = { viewCount: -1 }; // Ko‘rish soni ko‘tarilgan tartib
                    break;
                case "rating":
                    sort = { rating: -1 }; // Reyting bo‘yicha yuqoridan pastga
                    break;
                default:
                    sort = { position: 1 }; // Default tartib
                    break;
            }


            query.categories = { $in: [new mongoose.Types.ObjectId(category._id)] };

            const [minPrice = 0, maxPrice = Number.MAX_VALUE] = prices.map(Number);

            query.sale_price = { $gte: minPrice, $lte: maxPrice }

            let totalPage;

            if (attrs.length) {
                query.attributes = {
                    $elemMatch: {
                        $or: [
                            { 'value.uz': { $in: attrs } },
                            { 'value.ru': { $in: attrs } }
                        ]
                    }
                };
            }

            if (search) {
                const regex = new RegExp(search, 'i'); // 'i' flagi case-insensitive qidiruvni belgilaydi
                query = {
                    $or: [
                        { 'attributes.value.uz': { $elemMatch: { $regex: regex } } },
                        { 'attributes.value.ru': { $elemMatch: { $regex: regex } } },
                        { 'name.uz': regex },
                        { 'name.ru': regex },
                        { 'barcode': regex }
                    ]
                };
            }

            // if (search) {
            //     const options = {
            //         page,
            //         hitsPerPage: limit
            //     };

            //     // Algolia qidiruvini bajaramiz
            //     const { hits, nbPages, nbHits } = await productsIndex.search(search, options);

            //     // Mahsulotlar IDlarini yig'ib olish
            //     const ids = hits.map(item => item.objectID);
            //     query._id = { $in: ids };

            //     // Mahsulotlar sonini nbHits orqali olish
            //     totalPage = Math.ceil(nbHits / limit);

            // } else {
            //     // Agar search yoki attrs bo'lmasa, MongoDB orqali qidirish
            //     const countProducts = await shopProductModel.countDocuments(query);
            //     totalPage = Math.ceil(countProducts / limit); // Sahifalar sonini hisoblash
            // }

            const countProducts = await shopProductModel.countDocuments(query);
            totalPage = Math.ceil(countProducts / limit);

            const products = await shopProductModel.find(query)
                .sort(sort)
                .skip(page * limit)
                .limit(limit)
                .select('name orginal_price sale_price inStock slug images rating reviewsCount discount')

            const result = {
                totalPage,
                page,
                limit,
                category,
                products,
            }

            return reply.send(result);

        } catch (error) {
            if (error) {
                console.log(error);
                return reply.status(500).send("server ishlamayapti")
            }
        }
    }


    async filterData(req, reply) {
        try {
            const lang = req.headers["lang"] || 'uz';
            const { category_id = "" } = req.params;
            let query = {};

            query = { categories: { $in: [new mongoose.Types.ObjectId(category_id)] } }


            const maxMinPrices = await shopProductModel.aggregate([
                {
                    $match: query
                },

                // { $sort: { sale_price: -1 } },
                {
                    $group: {
                        _id: null,
                        maxPrice: { $max: "$sale_price" },  // Eng qimmat narx
                        minPrice: { $min: "$sale_price" }   // Eng arzon narx
                    }
                },

                {
                    $project: {
                        _id: 0, // _id maydonini olib tashlash
                        maxPrice: 1,
                        minPrice: 1
                    }
                }
            ]);


            const attributes = await shopProductModel.aggregate([
                {
                    $match: query
                },
                {
                    $unwind: "$attributes"  // `attributes` arrayini elementlarga ajratish
                },
                {
                    $match: {
                        "attributes.label": { $exists: true, $ne: "" },  // `value` maydoni bo'sh emasligini tekshirish
                        "attributes.value": { $exists: true, $ne: "" }
                    }
                },
                {
                    $group: {
                        _id: "$attributes.label",  // `label` bo'yicha guruhlash
                        values: { $addToSet: "$attributes.value" }  // `value` qiymatlarini yig'ish va unikal qilish
                    }
                },
                {
                    $project: {
                        _id: 0,  // `_id` ni olib tashlash
                        label: "$_id",  // `label`ni `_id` dan olamiz
                        values: 1  // yig'ilgan `values` qiymatlarini qaytarish
                    }
                }
            ]);

            return reply.send({
                maxPrice: maxMinPrices[0]?.maxPrice || 0,
                minPrice: maxMinPrices[0]?.minPrice || 0,
                attributes: attributes.length ? attributes.map(field => ({
                    label: field.label[lang],
                    items: field.values.map(val => val ? val[lang] : ''),
                    limit: 5,
                })) : []
            })

        } catch (error) {
            console.log(error)
            return reply.code(500).send(error.message)
        }
    }

    async totalProductCounts(req, reply) {
        try {
            const lang = req.headers["lang"] || 'uz';
            const { category_id = "" } = req.params;
            const search = req.query.search || "";
            const prices = req.query?.prices ? req.query.prices.split(",") : [];
            const attrs = req.query?.attrs ? req.query?.attrs.split(",") : [];
            let query = {};
            let totalDocuments;

            query = { categories: { $in: [new mongoose.Types.ObjectId(category_id)] } }

            const [minPrice = 0, maxPrice = Number.MAX_VALUE] = prices.map(Number);
            query.sale_price = { $gte: minPrice, $lte: maxPrice }

            if (attrs.length) {
                query.attributes = {
                    $elemMatch: {
                        $or: [
                            { 'value.uz': { $in: attrs } },
                            { 'value.ru': { $in: attrs } }
                        ]
                    }
                };
            }


            if (search) {
                const regex = new RegExp(search, 'i'); // 'i' flagi case-insensitive qidiruvni belgilaydi
                query = {
                    $or: [
                        { 'attributes.value.uz': { $elemMatch: { $regex: regex } } },
                        { 'attributes.value.ru': { $elemMatch: { $regex: regex } } },
                        { 'name.uz': regex },
                        { 'name.ru': regex },
                        { 'barcode': regex }
                    ]
                };
            }

            // if (search) {
            //     // Algolia qidiruvini bajaramiz
            //     const { hits, nbPages, nbHits } = await productsIndex.search(search);
            //     totalDocuments = nbHits;

            // } else {
            //     // Agar search yoki attrs bo'lmasa, MongoDB orqali qidirish
            //     const countProducts = await shopProductModel.countDocuments(query);
            //     totalDocuments = countProducts;
            // }

            const countProducts = await shopProductModel.countDocuments(query);
            totalDocuments = countProducts;

            return reply.send(totalDocuments)

        } catch (error) {
            console.log(error)
            return reply.code(500).send(error.message)
        }
    }

}

module.exports = new Category()