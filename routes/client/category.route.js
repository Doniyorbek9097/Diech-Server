const router = require("express").Router();
const slugify = require("slugify");
const mongoose = require("mongoose");
const { categoryModel } = require("../../models/category.model");
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

        let product = await categoryModel.find().populate("parentProducts").populate("subProducts").populate("childProducts");
        const productLenth = product.flatMap(cate => cate.parentProducts);


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
            path: "parentProducts",
            match : {
                $or: [
                        { slug: { $regex: search, $options: "i" }},
                    ]
            },
            limit: limit,
            sort: { createdAt: -1 },
            skip: page * limit
        })
        .populate({
            path: "subProducts",
            match : {
                $or: [
                        { slug: { $regex: search, $options: "i" }},
                    ]
            },
            limit: limit,
            sort: { createdAt: -1 },
            skip: page
        })
        .populate({
            path: "childProducts",
            match : {
                $or: [
                        { slug: { $regex: search, $options: "i" }},
                    ]
            },
            limit: limit,
            sort: { createdAt: -1 },
            skip: page
        })
        // .populate("brendId")


        return res.status(200).json({
            totalPage: Math.ceil(productLenth.length / limit),
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



// Get by slug name 
router.get("/category-slug/:slug", async (req, res) => {
    try {

        let page = parseInt(req.query?.page) - 1 || 0;
        let limit = parseInt(req.query?.limit) || 8;
        let search = req.query?.search || "";
        let product = await categoryModel.findOne({ slug: req.params.slug }).populate("parentProducts").populate("subProducts").populate("childProducts");
        const products = [...product?.parentProducts, ...product?.subProducts, ...product?.childProducts];

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
                match : {
                    $or: [
                            { slug: { $regex: search, $options: "i" }},
                        ]
                },
                limit: limit,
                sort: { createdAt: -1 },
                skip: page * limit
            })
            .populate({
                path: "subProducts",
                match : {
                    $or: [
                            { slug: { $regex: search, $options: "i" }},
                        ]
                },
                limit: limit,
                sort: { createdAt: -1 },
                skip: page
            })
            .populate({
                path: "childProducts",
                match : {
                    $or: [
                            { slug: { $regex: search, $options: "i" }},
                        ]
                },
                limit: limit,
                sort: { createdAt: -1 },
                skip: page
            })
            // .populate("brendId")


        return res.status(200).json({
            totalPage: Math.ceil(products.length / limit),
            page: page + 1,
            limit,
            category: category
        });
    } catch (error) {
        if (error) {
            console.log(error);
            res.status(500).json("server ishlamayapti")
        }
    }
})






module.exports = router;