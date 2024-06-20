const router = require("express").Router()
const { optionModel, optionValuesModel } = require("../../models/productOpion.model")


router.get("/option-all", async (req, res) => {
    try {
        const options = await optionModel.find();
        return res.json({
            message: "success",
            data: options
        })
    } catch (error) {
        console.log(error)
    }
})


router.post("/option-add", async (req, res) => {
    try {
        const option = await new optionModel(req.body).save();
        return res.json({
            message: "success",
            data: option
        })
    } catch (error) {
        console.log(error)
    }
})

router.post("/add-option-values", async (req, res) => {
    try {
        console.log(req.body)
        const values = await optionValuesModel.insertMany(req.body)
        return res.json({
            message: "success",
            data: values
        })
    } catch (error) {
        console.log(error)
    }
})


router.get("/option-one/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const option = await optionModel.findById(id);
        return res.json({
            message: "success",
            data: option
        })
    } catch (error) {
        console.log(error)
    }
})



router.delete("/option-delete/:id", async (req, res) => {
    try {
        const deleted = await optionModel.findByIdAndDelete(req.params.id)
        res.json({
            data: deleted,
            message: "succes deleted"
        })
    } catch (error) {
        console.log(error)
    }
})


module.exports = router