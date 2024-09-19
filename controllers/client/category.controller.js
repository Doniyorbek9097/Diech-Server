const mongoose = require("mongoose")
const categoryModel = require("../../models/category.model");
const _ = require('lodash');
const shopProductModel = require("../../models/shop.product.model");
const { algolia } = require("../../config/algolia");
const productsIndex = algolia.initIndex("products");


class Category {
    async all(req, reply) {
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
                        select: ["name", "slug", "images", "orginal_price", "sale_price", "discount", "reviews", "viewsCount"],
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
            const lang = req.headers["lang"] || 'uz';
            const slug = req.params?.slug || "";
            const page = parseInt(req.query?.page) - 1 || 0;
            const limit = parseInt(req.query?.limit) || 10;
            const search = req.query.search || "";
            const prices = req.query?.prices ? req.query.prices.split(",") : [];
            const attrs = req.query?.attrs ? req.query?.attrs.split(",") : [];
            const sortQuery = req.query.sort || "";

            let category = await categoryModel.findOne({ slug })
                .populate("fields")
                .populate("banners")
                .populate({
                    path: "children",
                    select: ['image', 'slug', 'name', 'icon'],
                })

            if (!category) return reply.send({ error: 'Category not found' });
            

            let query = {};
            let sort = { position: 1 };
            
            query.categories = { $in: [new mongoose.Types.ObjectId(category._id)] };

            const [minPrice = 0, maxPrice = Number.MAX_VALUE] = prices.map(Number);
            
            query.sale_price = { $gte: minPrice, $lte: maxPrice }
            
            let totalProducts;
            
            if (search) {            
                const options = { page, hitsPerPage: limit };
                const { hits, nbPages } = await productsIndex.search(search, options);
                const ids = hits.map(item => item.objectID);
                query._id = { $in: ids };
                totalProducts = nbPages;
              } else {
                const countProducts = await shopProductModel.countDocuments(query);
                totalProducts = Math.ceil(countProducts / limit);
              }
            
              
            const fields = category?.fields || [];
            const filters = [
                {
                    label: "categories",
                    items: category?.children || [],
                    limit: 5,
                },
                {
                    label: "fields",
                    items: fields.map(field => ({
                        label: field.label[lang],
                        items: field.values.map(val => val[lang]),
                        limit: 5,
                    })),
                    limit: 5,
                },
            ]

            // let productsIds = [];
            // productsIds = await shopProductModel.getRandomProducts({ query, limit, page, sort })
            // productsIds.length && (query._id = { $in: productsIds })

            const products = await shopProductModel.find(query)
                .sort(sort)
                .skip(page * limit)
                .limit(limit)
        
            
            const result = {
                message: "success",
                data: {
                    totalPage: Math.ceil(totalProducts / limit),
                    page: page,
                    limit,
                    category,
                    products,
                    filters
                }
            }
            
            return reply.send(result);

        } catch (error) {
            if (error) {
                console.log(error);
                return reply.status(500).send("server ishlamayapti")
            }
        }
    }
}

module.exports = new Category()