const router = require("express").Router();
const { shopProductModel, shopVariantModel } = require("../../models/shop.products.model")

router.get('/get-variants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const variants = await shopVariantModel.find({shopDetail: id})
        .populate({
            path:"variant",
        })
        
        res.json({
            data: variants,
            message:"success"
        })
    } catch (error) {
        console.log(error)
    }
})

router.post('/add-variant', async (req, res) => {
    try {
        const variants = req.body;

        if (!Array.isArray(variants)) {
            return res.status(400).json({ error: 'Invalid input, expected an array of variants.' });
        }

        for (const variant of variants) {
            await shopVariantModel.updateOne(
                { sku: variant.sku },
                { $set: variant },
                { upsert: true }
            );
        }

        return res.json({
            data: true,
            message:"success added"
        })

    } catch (error) {
        console.log(error)
    }
})


module.exports = router;
