const router = require("express").Router();
const slugify = require("slugify");
const shopModel = require("../../models/shop.model");
const { generateToken } = require("../../utils/generateToken");
const { checkToken } = require("../../middlewares/authMiddleware")

router.post("/shop", checkToken, async(req,res) => {
    try {
        req.body.slug = slugify(req.body.name);
        const shop = await shopModel.findOne({slug: req.body.slug})
        if(shop) return res.json({
            message:"Bu Do'kon yaratilgan",
            errShop: true
        });
        const result = await new shopModel(req.body).save();
        res.json({
            message: "Muoffaqiyatli yaratildi",
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).json("Serverda Xatolik")
    }
});


router.get("/shops", checkToken, async(req,res) => {
    try {
        const shops = await shopModel.find().populate("products").populate("owner")
        res.status(200).json(shops);
    } catch (error) {
        
    }
});


router.get("/shop/:id", checkToken, async(req,res) => {
    try {
        const result = await shopModel.findById(req.params.id)
        .populate({
            path:"products",
        })
        res.json(result)
    } catch (error) {
        console.log(error);
    }
});



router.put("/shop/:id", checkToken, async(req,res) => {
    try {
        req.body.slug = slugify(req.body.name);
        const result = await shopModel.findByIdAndUpdate(req.params.id, req.body);
        res.json({result, message:"success updated!"})
    } catch (error) {
        console.log(error)
    }
});


router.delete("/shop-delete/:id", checkToken, async(req,res)=> {
    try {
        const data = await shopModel.findByIdAndDelete(req.params.id);
        res.json({data, message:"success deleted!"});
    } catch (error) {
        console.log(error)
        res.json("Serverda xatolik");
    }
});




module.exports = router;