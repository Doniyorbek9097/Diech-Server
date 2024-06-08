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
const { productModel } = require("../../models/product.model");


// Get prent all category
router.get("/category-all", async (req, res) => {
    try {

        let categories = await categoryModel.find()
            .populate({
                path: "children",
                populate: {
                    path: "children",
                    populate: {
                        path: "products",
                        populate: {
                            path: "brend"
                        }
                    },
                },
            })


        return res.status(200).json({
            // totalPage: Math.ceil(products.length / limit),
            // page: page + 1,
            // limit,
            categories,
            // products,
        });

    } catch (err) {
        console.log(err)
        res.status(500).json("server ishlamayapti")
    }
});




module.exports = router;