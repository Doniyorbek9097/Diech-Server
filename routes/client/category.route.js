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



// Get prent all category
router.get("/categories", async (req, res) => {
    try {
        let page = parseInt(req.query?.page) - 1 || 0;
        let limit = parseInt(req.query?.limit) || 8;
        let search = req.query?.search || "";
        const cacheKey = `categories:${page}:${limit}:${search}`;
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

        return res.status(200).json({
            categories
        });

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

        let page = parseInt(req.query?.page) - 1 || 0;
        let limit = parseInt(req.query?.limit) || 8;
        let search = req.query?.search || "";

        let category = await categoryModel.findOne({ slug: req.params.slug })
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
                select: ['name slug images orginal_price sale_price discount'],
                populate: {
                    path:"product",
                    select: ['name images']
                }
            })


        if (!category) {
            return res.json({ error: 'Category not found' });
        }

        return res.status(200).json({
            totalPage: Math.ceil(category.shop_products.length / limit),
            page: page + 1,
            limit,
            category,
        });

    } catch (error) {
        if (error) {
            console.log(error);
            res.status(500).json("server ishlamayapti")
        }
    }
})






module.exports = router;