const mongoose = require("mongoose")
const categoryModel = require("../../models/category.model");
const _ = require('lodash');
const shopProductModel = require("../../models/shop.product.model");

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

            const categories = await categoryModel.find({ showHomePage: true })
            .populate({
                path: "shop_products",
                options: {
                  sort: { position: 1 },   // Narx bo'yicha kamayish tartibida sortlash
                  skip: page,               // 5 ta elementni tashlab o'tish
                  limit: 10              // Faqat 10 ta elementni qaytarish
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

    async oneBySlug(req, reply) {
        try {
            let { slug = "" } = req.params;
            let page = parseInt(req.query?.page) - 1 || 0;
            let limit = parseInt(req.query?.limit) || 10;
            let { search = "" } = req.query;
            const { lang = "" } = req.headers;

            let category = await categoryModel.findOne({ slug })
                .populate("fields")
                .populate("banners")
                .populate({
                    path: "children",
                    select: ['image', 'slug', 'name', 'icon'],
                })

            if (!category) {
                return reply.send({ error: 'Category not found' });
            }

            // const categories = _.uniqWith(_.flatMap(category.products, 'categories'),_.isEqual);
            // const { price = '' } = req.query;
            // const [minPrice = 0, maxPrice = Number.MAX_VALUE] = price ? price.split(',').map(Number) : [];
            // let products = await shopProductModel.find({categories:{$in: category._id}, orginal_price: { $gte: minPrice, $lte: maxPrice }}).populate("product")

            let query = { categories: { $in: [new mongoose.Types.ObjectId(category._id)] } };
            const sort = {position: 1};


            const totalProducts = await shopProductModel.countDocuments(query)
        
            let productsIds = [];
            productsIds = await categoryModel.getRandomProducts({ query, limit, page, sort })
            productsIds.length && (query._id = { $in: productsIds })

            const products = await shopProductModel.find(query)
            .sort(sort)
            .skip(page * limit)
            .limit(limit)
        
            const data = {
                message: "success",
                totalPage: Math.ceil(totalProducts / limit),
                page: page,
                limit,
                category,
                products
            }

            return data;

        } catch (error) {
            if (error) {
                console.log(error);
                return reply.status(500).send("server ishlamayapti")
            }
        }
    }
}

module.exports = new Category()