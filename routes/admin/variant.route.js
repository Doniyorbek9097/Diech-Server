const router = require("express").Router();
const { attributeModel, variantModel, productModel } = require("../../models/product.model");
const slugify = require("slugify")
router.get("/get-product-variants/:product_id", async(req, res) => {
    try {
        const { product_id } = req.params;
        const variants = await variantModel.find({product_id})

        res.json(variants)
    } catch (error) {
        console.log(error)
    }
})

router.post("/add-variant", async(req, res) => {
    try {
        for (const attr of req.body) {
            attr.sku = slugify(`${attr.slug}-${attr.sku}`);
        }
        
       const variants =  await variantModel.insertMany(req.body)
    res.json({
        data: variants,
        message: "success updated"
    })
     
    } catch (error) {
        console.log(error)
    }
})


router.put("/update-variant/:id", async(req, res) => {
    try {
        const {id} = req.params;
       const variant =  await variantModel.findOneAndUpdate({_id: id}, req.body)
    res.json({
        data: variant,
        message: "success updated"
    })
     
    } catch (error) {
        console.log(error)
    }
})


router.delete("/variant-delete/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const deleted = await variantModel.findOneAndDelete({_id:id})
        return res.json({
            message:"success deleted",
            data: deleted
        })
    } catch (error) {
        console.log(error)
    }
})


module.exports = router
