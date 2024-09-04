// const router = require("express").Router()
const catalogModel  = require('../../models/catalog')

const catalogRoutes = async(router, options) => {
    router.get('/catalog-all', async (req, res) => {
        try {
            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 8;
            const search = req.query.search || "";
            const { lang = "" } = req.headers;
          
    
            let catalogs = await catalogModel.find()
            .populate({
                path: "products",
                select: ['name', 'slug', 'images'],
                options: { limit, skip: page * limit }, // Apply pagination to shop_products
                populate: {
                    path: "shop", 
                    select: ['name', 'slug']
                }
            });
      
            const data = { message: "success",  data:catalogs };
    
            return data;
    
        } catch (error) {
            console.log(error)
            res.status(500).send("Serverda xatolik")
        }
    })
    
}




module.exports = catalogRoutes