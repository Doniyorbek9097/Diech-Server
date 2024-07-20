const router = require("express").Router()
const { catalogModel } = require('../../models/catalog')


router.post('/catalog-add', async (req, res) => {
    try {
        const catalogForm = req.body;
        const savedCatalog = await catalogModel.insertMany(catalogForm)
        res.json({
            data: savedCatalog,
            message: 'success added'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json("Serverda xatolik")
    }
})



router.get('/catalog-all', async (req, res) => {
    try {

        const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
        const limit = parseInt(req.query.limit, 10) || 8;

        const catalogs = await catalogModel.find()
        .populate({
            path: "products",
            select: ['name', 'slug', 'images', 'orginal_price', 'sale_price', 'discount', 'reviews', 'rating', 'viewsCount', 'attributes'],
            options: { limit, skip: page * limit }, // Apply pagination to shop_products
            populate: [
                { path: "product", select: ['name', 'slug', 'images'] },
                { path: "shop", select: ['name', 'slug'] }
            ]
        });

        res.json({
            data: catalogs,
            message: "success"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json("Serverda xatolik")
    }
})



router.delete("/catalog-delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
         const deleted = await catalogModel.findOneAndDelete({_id: id})
         res.json({
            message:"success deleted",
            data: deleted
         })
    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})


module.exports = router