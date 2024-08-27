const mongoose = require("mongoose")
const categoryModel = require("../../models/category.model");
const { redisClient } = require("../../config/redisDB");
const _ = require('lodash');
const shopProductModel = require("../../models/shop.product.model");

class Category {
    async all(req, res) {
        try {

            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 8;
            const search = req.query.search || "";
            const { lang = "" } = req.headers;

            redisClient.FLUSHALL()
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

    async oneBySlug(req, res) {
        try {
            let { slug = "" } = req.params;
            let page = parseInt(req.query?.page) - 1 || 0;
            let limit = parseInt(req.query?.limit) || 10;
            let { search = "" } = req.query;
            const { lang = "" } = req.headers;
            const random = Boolean(req.query.random)

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

            if (!category) {
                return res.json({ error: 'Category not found' });
            }

            // const categories = _.uniqWith(_.flatMap(category.products, 'categories'),_.isEqual);
            // const { price = '' } = req.query;
            // const [minPrice = 0, maxPrice = Number.MAX_VALUE] = price ? price.split(',').map(Number) : [];
            // let products = await shopProductModel.find({categories:{$in: category._id}, orginal_price: { $gte: minPrice, $lte: maxPrice }}).populate("product")

            let query = { categories: { $in: [new mongoose.Types.ObjectId(category._id)] } };
            let sort = {};


            const totalProducts = await shopProductModel.countDocuments(query)
            console.log(totalProducts);
            let productsIds = [];
            (productsIds = await categoryModel.getRandomProducts({ query, limit, page, sort }))
            productsIds.length && (query._id = { $in: productsIds })
        
            const products = await shopProductModel.find(query)
            .skip(page * limit)
            limit(limit)
        
            const data = {
                message: "success",
                totalPage: Math.ceil(totalProducts / limit),
                page: page,
                limit,
                category,
                products
            }

            redisClient.SETEX(cacheKey, 3600, JSON.stringify(data))
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