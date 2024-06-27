const router = require("express").Router();
const { shopProductModel, shopVariantsModel } = require("../../models/shop.products.model")

router.get('/get-variants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const variants = await shopVariantsModel.find({product: id})
        .populate({
            path:"attributes.option",
            select:['label']
        })
        .populate({
            path:"attributes.value",
            select:['label']
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
        for (const variant of req.body) {
           const result = await shopVariantsModel.updateOne(
                { skuid: variant.skuid },
                { $set: variant },
                { upsert: true }
            )

        }
    } catch (error) {
        console.log(error)
    }
})


module.exports = router;

[
  {
    label:"Xotira",
    "_id": "6676c5fb5f1481dcb610fedc",
    options: [
        {
            "label": "8gb",
            "_id": "6676c6317755b02ed121565b",
        },
        {
            "label": "16gb",
            "_id": "6676c6317755b02ed121565d",
        }
    ]
  }
]