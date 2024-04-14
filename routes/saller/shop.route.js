const router = require("express").Router();
const slugify = require("slugify");
const shopModel = require("../../models/shop.model");
const { generateToken } = require("../../utils/generateToken");


router.get("/shops/:user_id", async(req,res) => {
    try {
        const shops = await shopModel.find({owner: req.params.user_id})
        console.log(shops)
        res.status(200).json(shops);
    } catch (error) {
        
    }
});


router.get("/shop/:user_id/:shop_slug/", async(req,res) => {
    try {
        const { user_id, shop_slug } = req.params;
        const result = await shopModel.findOne({slug: shop_slug, owner: user_id})
        .populate({
            path:"products",
        })

        res.status(200).json(result)
    } catch (error) {
        console.log(error.message);
        res.status(500).json(`Serverda Xatolik ${error.message}`)

    }
});


router.get("/shop_id/:id", async(req,res) => {
    try {
        const result = await shopModel.findById(req.params.id)
        .populate({
            path:"products",
        })

        res.status(200).json(result.toObject())
    } catch (error) {
        console.log(error.message);
        res.status(500).json(`Serverda Xatolik ${error.message}`)

    }
});


router.put("/shop/:id", async(req,res) => {
    try {
        const result = await shopModel.findByIdAndUpdate(req.params.id, req.body)
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json("Serverda Xatolik "+ error.message)
        console.log(error.message);
    }
});



module.exports = router;