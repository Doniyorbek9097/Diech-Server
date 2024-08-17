const router = require("express").Router()
const catalogModel  = require('../../models/catalog')
const { redisClient } = require("../../config/redisDB");


router.get('/catalog-all', async (req, res) => {
    try {

        // redisClient.FLUSHALL()
        const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
        const limit = parseInt(req.query.limit, 10) || 8;
        const search = req.query.search || "";
        const { lang = "" } = req.headers;
        const cacheKey = `catalogs:${lang}:${page}:${limit}:${search}`;
        const cacheData = await redisClient.get(cacheKey);
        if (cacheData) {
            return res.json(JSON.parse(cacheData));
        }

        let catalogs = await catalogModel.find()
        .populate({
            path: "products",
            select: ['name', 'slug', 'images'],
            options: { limit, skip: page * limit }, // Apply pagination to shop_products
            populate: [
                { 
                    path: "details",
                    populate: {
                        path: "shop", 
                        select: ['name', 'slug']
                    }
                 }
            ]
        });

        catalogs = catalogs.flatMap(cate => {
            cate.products = cate.products.filter((item => item?.details?.length));
            return cate;
        })

        const data = { message: "success",  data:catalogs };

        redisClient.SETEX(cacheKey, 3600, JSON.stringify(data));
        
        res.json(data)

    } catch (error) {
        console.log(error)
        res.status(500).json("Serverda xatolik")
    }
})



module.exports = router