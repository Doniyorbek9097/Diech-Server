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


// Create new Category 
router.post("/category-add", async (req, res) => {
    try {

        if (!req.body.name || (!req.body.name.uz && !req.body.name.ru))
            return res.status(404).send("category name not found");
        req.body.slug = slugify(req.body.name.uz)

        const CategoryInstance = new categoryModel(req.body);
        if (CategoryInstance.parent) {
            await categoryModel.updateOne(
                { _id: CategoryInstance.parent },
                { $push: { children: CategoryInstance.id } }
            );
        }

        const newCategory = await CategoryInstance.save();
        return res.status(201).json(newCategory)

    } catch (error) {
        return res.status(500).json("server ishlamayapti")
    }
});



// Get all category
router.get("/category-all", async (req, res) => {
    try {

        let page = parseInt(req.query.page) - 1 || 0;
        let limit = parseInt(req.query.limit) || 1;
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





// Get byId Category 
router.get("/category-one/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).send("Category Id haqiqiy emas");
        }

        let category = await categoryModel.findById(req.params.id);
        if (!category) return res.status(404).send("Category topilmadi");
        return res.status(200).json(category.toObject());

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
})



// Edit Category 
router.put("/category-edit/:id", async (req, res) => {
    try {
        const upadted = await categoryModel.findByIdAndUpdate(req.params.id, req.body);
        return res.status(200).json(upadted);

    } catch (error) {
        if (error) {
            if (image) {
                const imagePath = path.join(__dirname, `../uploads/${path.basename(image)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }


            for (const banner of left_banner) {
                if (banner) {
                    const bannerUzPath = path.join(__dirname, `../uploads/${path.basename(banner.image.uz)}`);
                    const bannerRuPath = path.join(__dirname, `../uploads/${path.basename(banner.image.ru)}`);
                    fs.unlink(bannerUzPath, (err) => err && console.log(err));
                    fs.unlink(bannerRuPath, (err) => err && console.log(err));
                }
            }

            for (const banner of top_banner) {
                if (banner) {
                    const bannerUzPath = path.join(__dirname, `../uploads/${path.basename(banner.image.uz)}`);
                    const bannerRuPath = path.join(__dirname, `../uploads/${path.basename(banner.image.ru)}`);
                    fs.unlink(bannerUzPath, (err) => err && console.log(err));
                    fs.unlink(bannerRuPath, (err) => err && console.log(err));
                }
            }


            return res.status(500).json("server ishlamayapti")
        }
    }
});


// Delete Category 
router.delete("/category-delete/:id", async (req, res) => {
    try {
        const allCategoies = [];
        let parentDeleted = await categoryModel.findByIdAndDelete(req.params.id);
        if (!parentDeleted) return res.status(404).json("Category not found");
        parentDeleted = parentDeleted.toObject();

        const subDeleted = parentDeleted && await categoryModel.findOneAndDelete({ parentId: parentDeleted._id });
        const childDeleted = subDeleted && await categoryModel.findOneAndDelete({ parentId: subDeleted._id });
        allCategoies.push(parentDeleted, subDeleted, childDeleted);

        for (const cate of allCategoies) {
            if (cate && cate.image) {
                const imagePath = path.join(__dirname, `../uploads/${path.basename(cate.image)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }


            if (cate && cate.left_banner?.length) {
                for (const banner of cate.left_banner) {
                    const bannerUzPath = path.join(__dirname, `../uploads/${path.basename(banner.image.uz)}`);
                    const bannerRuPath = path.join(__dirname, `../uploads/${path.basename(banner.image.ru)}`);
                    fs.unlink(bannerUzPath, (err) => err && console.log(err));
                    fs.unlink(bannerRuPath, (err) => err && console.log(err));
                }
            }

            if (cate && cate.top_banner?.length) {
                for (const banner of cate.top_banner) {
                    const bannerUzPath = path.join(__dirname, `../uploads/${path.basename(banner.image.uz)}`);
                    const bannerRuPath = path.join(__dirname, `../uploads/${path.basename(banner.image.ru)}`);
                    fs.unlink(bannerUzPath, (err) => err && console.log(err));
                    fs.unlink(bannerRuPath, (err) => err && console.log(err));
                }
            }

        }


        res.status(200).json(parentDeleted);

    } catch (error) {
        console.log(error);
        res.status(500).json("category o'chirib bo'lmadi")
    }
});



router.delete("/delete-left-banner", async(req, res) => {
    const { category_id, banner_id } = req.body;
    const deletedBanner = await categoryModel.updateOne({_id:category_id}, {$pull:{left_banner: {_id: banner_id}}});

})





module.exports = router;