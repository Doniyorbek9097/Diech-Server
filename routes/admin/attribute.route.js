const router = require("express").Router();
const { attributeModel, productModel } = require("../../models/product.model")

router.get("/get-product-attribute/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const product = await productModel.findById(id)
        .populate({
            path:"attributes",
            populate: [
                {
                    path:"option",
                },
                {
                    path:"options.option",
                }
            ]
        })

        product.attributes = product.attributes.map(attr => {
            return {
                _id: attr.option._id,
                label: attr.option.label,
                images: attr.option?.images,
                options: attr.options.map(val => ({
                    _id:val.option._id,
                    label: val.option.label,
                    images: val.images
                }))
            }
        })
        
        res.json(product)
    } catch (error) {
        console.log(error)
    }
})

router.post("/add-attribute", async(req, res) => {
    try {
        for (const attr of req.body) {
         await attributeModel.updateOne(
            {option: attr.option},
            {$set: attr},
            {upsert: true}
         )   
        }

    res.json({
        message: "success updated"
    })
     
    } catch (error) {
        console.log(error)
    }
})


module.exports = router


const categories = [{
    label:"A",
    options: [{
        label:"B",
        options: [{
            label:"D",
            options: [{
                label:"Z",
                options:[{
                    label:"X",
                    options:[{
                        label:"V"
                    }]
                }]
            }]
        }]
    }]
}]