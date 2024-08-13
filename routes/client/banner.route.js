const { redisClient } = require("../../config/redisDB");
const bannerModel = require("../../models/banner.model");
const router = require("express").Router();



router.get("/banner-all", async(req,res) => {
    try {
        const cacheKey = "banners";
        const cacheData = await redisClient.get(cacheKey)
        if(cacheData) return res.json(JSON.parse(cacheData));
        const { category_id } = req.query;
        const query = {};
        if(category_id) query.category_id = category_id;
        else query.category_id = { $exists: false };

        let banners = await bannerModel.find(query);

        const data = {
            message: "success",
            data: banners
        }

       redisClient.SETEX(cacheKey, 3600, JSON.stringify(data));
       res.json(data);

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message)
    }
});



module.exports = router;