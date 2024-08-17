const categoryModel = require("../../models/category.model");
const { redisClient } = require("../../config/redisDB");
const _ = require('lodash');

class Category {
    async all(req, res) {
        try {

            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 8;
            const search = req.query.search || "";
            const { lang = "" } = req.headers;

            // redisClient.FLUSHALL()
            const cacheKey = `categories:${lang}:${page}:${limit}:${search}`;
            const cacheData = await redisClient.get(cacheKey);
            if (cacheData) {
                return res.json(JSON.parse(cacheData));
            }

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

            redisClient.SETEX(cacheKey, 3600, JSON.stringify(data));

            return res.status(200).json(data);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server is not working" });
        }
    }


    async allByIds(req, res) {
        try {
            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 8;
            const query = {}

            if(req.query?.recommendations?.length) {
                query._id = {$in: req.query?.recommendations?.split(",")}
            }

            const data = await categoryModel.find(query)
            .populate({
                path: "products",
                select: ['name', 'slug', 'images'],
                options: { limit, skip: page * limit }, // Apply pagination to shop_products
                populate: [
                    { 
                        path: "details",
                        populate: {
                            path: "shop", 
                            select: ['name', 'slug']
                        }
                     }
                ]
            })

            res.json(data)

        } catch (error) {
            console.log(error)
        }
    }


    async oneBySlug(req, res) {
        try {
            let { slug = "" } = req.params;
            let page = parseInt(req.query?.page) - 1 || 0;
            let limit = parseInt(req.query?.limit) || 10;
            let { search = "" } = req.query;
            const { lang = "" } = req.headers;
            redisClient.FLUSHALL()

            const cacheKey = `category-slug:${lang}:${slug}:${page}:${limit}:${search}`;
            const cacheData = await redisClient.get(cacheKey)
            if (cacheData) return res.json(JSON.parse(cacheData))

            let category = await categoryModel.findOne({ slug })
                .populate("banners")
                .populate({
                    path: "children",
                    select: ['image', 'slug', 'name', 'icon'],
                })
                .populate({
                    path: "products",
                    options: {limit, skip: page * limit },
                    select: ['name', 'slug', 'images', 'attributes'],
                    populate: [
                        {
                            path: "details",
                            select: ['orginal_price', 'sale_price', 'discount', 'reviews', 'rating', 'viewsCount']
                        }
                    ]
                })

            if (!category) {
                return res.json({ error: 'Category not found' });
            }

            // const categories = _.uniqWith(_.flatMap(category.products, 'categories'),_.isEqual);
            // const { price = '' } = req.query;
            // const [minPrice = 0, maxPrice = Number.MAX_VALUE] = price ? price.split(',').map(Number) : [];
            // let products = await shopProductModel.find({categories:{$in: category._id}, orginal_price: { $gte: minPrice, $lte: maxPrice }}).populate("product")


            // To'liq mahsulotlar sonini olish
            const totalProductsCount = await categoryModel.findOne({ slug })
            .populate({
                path: "products",
                select: '_id'  // Faqat ID-larni olish orqali mahsulotlar sonini hisoblash
            })
            .then(category => category.products.length);

            const data = {
                message: "success",
                totalPage: Math.ceil(totalProductsCount / limit),
                page: page + 1,
                limit,
                data: category,
            }

            // redisClient.SETEX(cacheKey, 3600, JSON.stringify(data))
            return res.json(data);

        } catch (error) {
            if (error) {
                console.log(error);
                res.status(500).json("server ishlamayapti")
            }
        }
    }
}

module.exports = new Category()