const router = require("express").Router();
const slugify = require("slugify");
const mongoose = require("mongoose");
const { categoryModel } = require("../../models/category.model");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { isEqual } = require("../../utils/isEqual");
const path = require("path");
const fs = require("fs");
const { redisClient } = require("../../config/redisDB");
const { message } = require("telegraf/filters");
const _ = require('lodash');
const { shopProductModel } = require("../../models/shop.products.model");


// Get prent all category
router.get("/categories", async (req, res) => {
    try {
        let page = parseInt(req.query?.page) - 1 || 0;
        let limit = parseInt(req.query?.limit) || 8;
        let search = req.query?.search || "";
        const {lang = ""} = req.headers;

        const cacheKey = `categories:${lang}:${page}:${limit}:${search}`;
        const cacheData = await redisClient.get(cacheKey)
        if(cacheData) return res.json(JSON.parse(cacheData))
            
        let categories = await categoryModel.find({ parent: undefined })
            .populate({
                path: "children",
                populate: {
                    path: "children"
                }
            })
            .populate({
                path: "parent",
                populate: {
                    path: "parent"
                }
            })

            .populate({
                path: "shop_products",
                select: ['name', 'slug', 'images', 'orginal_price', 'sale_price','discount','reviews', 'rating', 'viewsCount', 'attributes'],
                populate: [
                    {
                        path:"product",
                        select: ['name','slug','images'],
                    },
                    {
                        path:"shop",
                        select: ['name', 'slug']
                    }
                ]
            })

        const products = categories.flatMap(cate => cate.shop_products);
        const data = {
            totalPage: Math.ceil(products.length / limit),
            page: page + 1,
            limit,
            categories
        }


        redisClient.SETEX(cacheKey, 3600, JSON.stringify(data))
        return res.status(200).json(data);

    } catch (err) {
            console.log(err)
            res.status(500).json("server ishlamayapti")
    }
});



router.get("/category-all", async (req, res) => {
    try {
        let search = req.query.search || "";
        const cacheKey = `category-all:${search}`;
        const cacheData = await redisClient.get(cacheKey)
        if(cacheData) return res.json({
            categories: JSON.parse(cacheData),
            message:"success"
        })

        let categories = await categoryModel.find({ slug:{ $regex: search, $options: "i" } },)
        .limit(3)
        
        redisClient.SETEX(cacheKey, 3600, JSON.stringify(categories));
        return res.status(200).json(categories);

    } catch (err) {
        if (err) {
            console.log(err)
            res.status(500).json("server ishlamayapti")
        }
    }
});





// Get by slug name 
router.get("/category-slug/:slug", async (req, res) => {
    try {
        let {slug = ""} = req.params;
        let page = parseInt(req.query?.page) - 1 || 0;
        let limit = parseInt(req.query?.limit) || 8;
        let {search = ""} = req.query;
        const {lang = ""} = req.headers;

        const cacheKey = `category-slug:${lang}:${slug}:${page}:${limit}:${search}`;
        const cacheData = await redisClient.get(cacheKey)
        if(cacheData) return res.json(JSON.parse(cacheData))

        let category = await categoryModel.findOne({ slug })
        .populate({
            path: "children",
            populate: {
                path: "children"
            }
        })
        .populate({
            path: "parent",
            populate: [
                {
                    path: "parent"
                },

                {
                    path: "children"
                }
            ]
        })

        .populate({
            path: "shop_products",
            select: ['name', 'slug', 'images', 'orginal_price', 'sale_price','discount','reviews', 'rating', 'viewsCount', 'attributes','variants'],
            populate: [
                {
                    path:"categories",
                    select: ['name', 'slug']
                },
                {
                    path:"product",
                    select: ['name', 'slug', 'images']
                },
                {
                    path:"brend",
                    select: ['name', 'slug']
                },
                {
                    path:"shop",
                    select: ['name', 'slug']
                }
            ]
        })

        
        if (!category) {
            return res.json({ error: 'Category not found' });
        }

        const categories = _.uniqWith(_.flatMap(category.shop_products, 'categories'),_.isEqual);
        const { price = '' } = req.query;
        const [minPrice = 0, maxPrice = Number.MAX_VALUE] = price ? price.split(',').map(Number) : [];
        let products = await shopProductModel.find({categories:{$in: category._id}, orginal_price: { $gte: minPrice, $lte: maxPrice }}).populate("product")

        if (products.length) {
            category.shop_products = products;
        } else {
            category.shop_products = [];
        }

        const data = {
            totalPage: Math.ceil(category.shop_products.length / limit),
            page: page + 1,
            limit,
            category,
            categories
        }

        redisClient.SETEX(cacheKey, 3600, JSON.stringify(data))
        return res.json(data);

    } catch (error) {
        if (error) {
            console.log(error);
            res.status(500).json("server ishlamayapti")
        }
    }
})






module.exports = router;