const slugify = require("slugify");
const shopModel = require("../../models/shop.model");
const router = require("express").Router();


router.post("/shop", async(req,res) => {
    try {
        req.body.slug = slugify(req.body.slug);
        const result = await new shopModel(req.body).save();
        res.json({result})
    } catch (error) {
        console.log(error)
    }
});


router.get("/shops", async(req,res) => {
    try {
        const shops = await shopModel.find()
        .populate("employees")
        .populate("products")
        .populate("point")

        res.json({
            data: shops,
            message: "success"
        });
    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
});



router.get("/shop/:id", async(req,res) => {
    try {
        const result = await shopModel.findById(req.params.id);
        res.json({result})
    } catch (error) {
        console.log(error);
    }
});


router.put("/shop/:id", async(req,res) => {
    try {
        req.body.slug = slugify(req.body.name);
        const result = await shopModel.findByIdAndUpdate(req.params.id, req.body);
        res.json({result, message:"success updated!"})
    } catch (error) {
        console.log(error)
    }
});


router.delete("/shop/:id", async(req,res)=> {
    try {
        const result = await shopModel.findByIdAndDelete(req.params.id);
        res.json({result, message:"success deleted!"});
    } catch (error) {
        console.log(error)
    }
});




module.exports = router;