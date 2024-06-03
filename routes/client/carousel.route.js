const { redisClient } = require("../../config/redisDB");
const carouselModel = require("../../models/carousel.model");
const router = require("express").Router();



router.get("/carousel-all", async(req,res) => {
    try {
        const cacheKey = "carousel"
        const cacheData = await redisClient.get(cacheKey)
        if(cacheData) return res.json(JSON.parse(cacheData));

        let result = await carouselModel.find();
        redisClient.SETEX(cacheKey, 3600, JSON.stringify(result));
       return res.json(result);

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message)
    }
});



module.exports = router;