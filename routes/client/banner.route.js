const bannerModel = require("../../models/banner.model");
// const router = require("express").Router();

const bannerRoutes = async(router, options) => {
    router.get("/banner-all", async(req,res) => {
        try {
            const { category_id } = req.query;
            const query = {};
            if(category_id) query.category_id = category_id;
            else query.category_id = undefined;
    
            let banners = await bannerModel.find(query);
    
            const data = {
                message: "success",
                data: banners
            }
    
           return data;
    
        } catch (error) {
            console.log(error);
            res.status(500).send(error.message)
        }
    });
    
}


module.exports = bannerRoutes;