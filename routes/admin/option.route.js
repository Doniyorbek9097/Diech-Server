const { productOptionModel } = require("../../models/product.model");

const router = require("express").Router();

router.post("/option-add", async(req, res)=> {
    try {
        const newOption = await new productOptionModel(req.body).save();
        return res.json({
            message:"Success",
            data: newOption
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message)
    }
});


router.get("/option-all", async(req, res) => {
    try {
        const options = await productOptionModel.find();
        return res.json({
            message: "Success",
            data: options
        })
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message)
    }
});


router.delete("/option-delete/:id", async(req, res) => {
    try {
        const deleteOption = await productOptionModel.findByIdAndDelete(req.params.id);
        return res.json(deleteOption)
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message)

    }
})






module.exports = router;