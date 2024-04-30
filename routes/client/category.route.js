const router = require("express").Router();
const slugify = require("slugify");
const mongoose = require("mongoose");
const { categoryModel } = require("../../models/category.model");
const { productModel } = require("../../models/product.model")
const langReplace = require("../../utils/langReplace");
const nestedCategories = require("../../utils/nestedCategories");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { isEqual } = require("../../utils/isEqual");
const path = require("path");
const fs = require("fs");





// Get prent all category
router.get("/categories", async (req, res) => {
    try {

        let page = parseInt(req.query.page) - 1 || 0;
        let limit = parseInt(req.query.limit) || 8;
        let search = req.query.search || "";


        let categories = await categoryModel.find({ parent: undefined, slug:{ $regex: search, $options: "i" } },)
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
                path: "parentProducts",
                match: {
                    $or: [
                        { slug: { $regex: search, $options: "i" } },
                    ]
                },
                limit: limit,
                sort: { createdAt: -1 },
                skip: page * limit
            })
            .populate({
                path: "subProducts",
                match: {
                    $or: [
                        { slug: { $regex: search, $options: "i" } },
                    ]
                },
                limit: limit,
                sort: { createdAt: -1 },
                skip: page
            })
            .populate({
                path: "childProducts",
                match: {
                    $or: [
                        { slug: { $regex: search, $options: "i" } },
                    ]
                },
                limit: limit,
                sort: { createdAt: -1 },
                skip: page
            })
        // .populate("brendId")

        const productsLenth = categories.map(category => category.parentProducts.length + category.subProducts.length + category.childProducts.length);

        return res.status(200).json({
            totalPage: Math.ceil(productsLenth / limit),
            page: page + 1,
            limit,
            categories
        });

    } catch (err) {
        if (err) {
            console.log(err)
            res.status(500).json("server ishlamayapti")
        }
    }
});





// Get all category
router.get("/category-name", async (req, res) => {
    try {
        let search = req.query.search || "";
        let categories = await categoryModel.find()
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
                path: "parentProducts",
                match: {
                    $or: [
                        { slug: { $regex: search, $options: "i" } },
                    ]
                }
            })
            .populate({
                path: "subProducts",
                match: {
                    $or: [
                        { slug: { $regex: search, $options: "i" } },
                    ]
                },
            })
            .populate({
                path: "childProducts",
                match: {
                    $or: [
                        { slug: { $regex: search, $options: "i" } },
                    ]
                }
            })
        // .populate("brendId")

        const products = categories.flatMap(category =>  [category , ...category.parentProducts, ...category.subProducts, ...category.childProducts] );

        return res.status(200).json({
            categories: products
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
        const colorFilter = req.query.color || '';
        const sizeFilter = req.query.size || '';
        const ratingFilter = parseInt(req.query.rating) || 0;

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
                path: "parentProducts",
                limit: limit,
                sort: { createdAt: -1 },
                skip: page * limit
            })
            .populate({
                path: "subProducts",
                limit: limit,
                sort: { createdAt: -1 },
                skip: page
            })
            .populate({
                path: "childProducts",
                limit: limit,
                sort: { createdAt: -1 },
                skip: page
            });


        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const CategoryProducts = [...category.parentProducts, ...category.subProducts, ... category.childProducts];
        
        const matchFilters = {_id: {$in: CategoryProducts}, slug:{ $regex: search, $options: "i" } };
        colorFilter && (matchFilters.colors = { $in: colorFilter.split(',') });
        sizeFilter && (matchFilters.sizes = { $in: sizeFilter.split(',') });
        ratingFilter && (matchFilters.rating = { $gte: ratingFilter });
        const products = await productModel.find(matchFilters);

        return res.status(200).json({
            totalPage: Math.ceil(products.length / limit),
            page: page + 1,
            limit,
            category,
            products
        });

    } catch (error) {
        if (error) {
            console.log(error);
            res.status(500).json("server ishlamayapti")
        }
    }
})






module.exports = router;