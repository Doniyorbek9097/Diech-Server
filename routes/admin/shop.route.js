const router = require("express").Router();
const slugify = require("slugify");
const shopModel = require("../../models/shop.model");
const { generateToken } = require("../../utils/generateToken");
const { checkToken } = require("../../middlewares/authMiddleware")
const fileService = require("../../services/file.service")

router.post("/shop", checkToken, async(req,res) => {
    const shopData = req.body;
    try {
        shopData.slug = slugify(shopData.name);

        const shop = await shopModel.findOne({slug: shopData.slug})
        if(shop) return res.json({
            message:"Bu Do'kon yaratilgan",
            errShop: true
        });

        shopData?.image && (shopData.image = await fileService.upload(req, shopData.image))
        shopData?.bannerImage && (shopData.bannerImage = await fileService.upload(req, shopData.bannerImage))
       
        const result = await new shopModel(shopData).save();
        res.json({
            message: "Muoffaqiyatli yaratildi",
            data: result
        })
    } catch (error) {
        shopData?.image && await fileService.remove(req, shopData.image)
        shopData?.bannerImage && await fileService.remove(req, shopData.bannerImage)

        console.log(error);
        res.status(500).json("Serverda Xatolik")
    }
});


router.get("/shops", checkToken, async(req,res) => {
    try {
        const shops = await shopModel.find()
        .populate("employees")
        .populate("products")
        .populate("point")

        res.status(200).json(shops);
    } catch (error) {
        
    }
});


router.get("/shop/:id", checkToken, async(req,res) => {
    try {
        const result = await shopModel.findById(req.params.id)
        .populate("employees")
        .populate("products")
        .populate({
            path:"products",
        })
        res.json(result)
    } catch (error) {
        console.log(error);
    }
});



router.put("/shop-update/:id", checkToken, async(req,res) => {
    const shopData = req.body;

    try {
        shopData.slug = slugify(req.body.name);
        shopData?.image && (shopData.image = await fileService.upload(req, shopData.image))
        shopData?.bannerImage && (shopData.bannerImage = await fileService.upload(req, shopData.bannerImage))
       
        const result = await shopModel.findByIdAndUpdate(req.params.id, shopData);
        res.json({
            data:result, 
            message:"success updated!"
        })
        shopData?.deletedImages?.length && await fileService.remove(shopData.deletedImages)

    } catch (error) {
        shopData?.image && await fileService.remove(req, shopData.image)
        shopData?.bannerImage && await fileService.remove(req, shopData.bannerImage)

        console.log(error)
        res.status(500).json(error.message)
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