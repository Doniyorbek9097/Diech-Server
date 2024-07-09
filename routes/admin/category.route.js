const router = require("express").Router();
const slugify = require("slugify");
const mongoose = require("mongoose");
const { categoryModel } = require("../../models/category.model");
const langReplace = require("../../utils/langReplace");
const nestedCategories = require("../../utils/nestedCategories");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { isEqual } = require("../../utils/isEqual");
const { checkToken } = require("../../middlewares/authMiddleware")
const { redisClient } = require("../../config/redisDB");
const { generateOTP } = require("../../utils/otpGenrater")
const path = require("path");
const fs = require("fs");

// Create new Category 
router.post("/category-add", checkToken, async (req, res) => {
    try {
        redisClient.FLUSHALL()
        const formData = req.body;

        for (const cate of formData) {
             cate.slug = slugify(`${cate.name.ru.toLowerCase()}-${generateOTP(5)}`)
        }
        
        const newCategory = await categoryModel.insertMany(formData);
        return res.json({
            data: newCategory,
            message: "Success"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json("server ishlamayapti")
    }
});



// Get all category
router.get("/category-all", async (req, res) => {
    try {

        let page = parseInt(req.query.page) - 1 || 0;
        let limit = parseInt(req.query.limit) || 1;
        let search = req.query.search || "";

        let categories = await categoryModel.find({ parent: undefined })
        const products = categories.flatMap(cate => cate.products);

        return res.status(200).json({
            totalPage: Math.ceil(products.length / limit),
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




// Get byId one Category 
router.get("/category-one/:id", checkToken, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).send("Category Id haqiqiy emas");
        }

        let category = await categoryModel.findById(req.params.id)
        .populate({
            path: "children",
            populate: {
                path: "children"
            }
        })

        if (!category) return res.status(404).send("Category topilmadi");
        return res.status(200).json(category);

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
})

// Get byId Category 
router.get("/category/:id", checkToken, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).send("Category Id haqiqiy emas");
        }

        let category = await categoryModel.findById(req.params.id)
        .populate({
            path: "children",
            populate: {
                path: "children"
            }
        })

        if (!category) return res.status(404).send("Category topilmadi");
        return res.status(200).json(category.toObject());

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
})




// Edit Category 
router.put("/category-edit/:id", checkToken, async (req, res) => {
    redisClient.FLUSHALL()
    req.body.slug = slugify(`${req.body.name.ru.toLowerCase()}-${generateOTP(5)}`)

    if (req.body?.left_banner) {
        const { image } = req.body.left_banner;
        req.body.left_banner.image.uz = await new Base64ToFile(req).bufferInput(image.uz).save();
        req.body.left_banner.image.ru = await new Base64ToFile(req).bufferInput(image.ru).save();
    }

    if (req.body?.top_banner) {
        const {image} = req.body.top_banner;
        req.body.top_banner.image.uz = await new Base64ToFile(req).bufferInput(image.uz).save();
        req.body.top_banner.image.ru = await new Base64ToFile(req).bufferInput(image.ru).save();
    }


    try {

        const upadted = await categoryModel.findByIdAndUpdate(req.params.id, req.body);

        return res.status(200).json(upadted);

    } catch (error) {

        if (req.body?.left_banner) {
            const { image } = req.body.left_banner;
            const bannerUzPath = path.join(__dirname, `../../uploads/${path.basename(image.uz)}`);
            const bannerRuPath = path.join(__dirname, `../../uploads/${path.basename(image.ru)}`);
            fs.unlink(bannerUzPath, (err) => err && console.log(err));
            fs.unlink(bannerRuPath, (err) => err && console.log(err));
        }


        if (req.body?.top_banner) {
            const { image } = req.body.left_banner;
            const bannerUzPath = path.join(__dirname, `../../uploads/${path.basename(image.uz)}`);
            const bannerRuPath = path.join(__dirname, `../../uploads/${path.basename(image.ru)}`);
            fs.unlink(bannerUzPath, (err) => err && console.log(err));
            fs.unlink(bannerRuPath, (err) => err && console.log(err));
        }



        if (req.body.image) {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(req.body.image)}`);
            fs.unlink(imagePath, (err) => err && console.log(err));
        }

        if (req.body.icon) {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(req.body.icon)}`);
            fs.unlink(imagePath, (err) => err && console.log(err));
        }

        return res.status(500).json("server ishlamayapti")
    }
});


router.get("/categories-update", async (req, res) => {
    let categories = await categoryModel.find()
    const n =  categories.map(async cate => {
        const slug = slugify(`${cate.toObject().name.ru.toLowerCase()}-${generateOTP(5)}`)
       return await categoryModel.updateOne({_id: cate._id}, {$set:{slug: slug}})
    })

    res.json("success")

})

// Delete Category 
router.delete("/category-delete/:id", checkToken, async (req, res) => {
    try {
        redisClient.FLUSHALL()

        const allCategoies = [];
        let parentDeleted = await categoryModel.findByIdAndDelete(req.params.id);
        if (!parentDeleted) return res.status(404).json("Category not found");
        parentDeleted = parentDeleted.toObject();

        const subDeleted = parentDeleted && await categoryModel.findOneAndDelete({ parentId: parentDeleted._id });
        const childDeleted = subDeleted && await categoryModel.findOneAndDelete({ parentId: subDeleted._id });
        allCategoies.push(parentDeleted, subDeleted, childDeleted);

        for (const cate of allCategoies) {
            if (cate?.left_banner) {
                const { image } = cate.left_banner;
                const bannerUzPath = path.join(__dirname, `../../uploads/${path.basename(image.uz)}`);
                const bannerRuPath = path.join(__dirname, `../../uploads/${path.basename(image.ru)}`);
                fs.unlink(bannerUzPath, (err) => err && console.log(err));
                fs.unlink(bannerRuPath, (err) => err && console.log(err));
            }


            if (cate?.top_banner) {
                const { image } = cate.left_banner;
                const bannerUzPath = path.join(__dirname, `../../uploads/${path.basename(image.uz)}`);
                const bannerRuPath = path.join(__dirname, `../../uploads/${path.basename(image.ru)}`);
                fs.unlink(bannerUzPath, (err) => err && console.log(err));
                fs.unlink(bannerRuPath, (err) => err && console.log(err));
            }



            if (cate?.image) {
                const imagePath = path.join(__dirname, `../../uploads/${path.basename(cate.image)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }

            if (req.body?.icon) {
                const imagePath = path.join(__dirname, `../../uploads/${path.basename(req.body.icon)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }

        }


        res.status(200).json(parentDeleted);

    } catch (error) {
        console.log(error);
        res.status(500).json("category o'chirib bo'lmadi")
    }
});



router.delete("/delete-left-banner", checkToken, async (req, res) => {
    const { category_id, banner_id } = req.body;
    const deletedBanner = await categoryModel.updateOne({ _id: category_id }, { $pull: { left_banner: { _id: banner_id } } });

})





module.exports = router;