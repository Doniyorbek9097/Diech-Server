const colorModel = require("../../models/color.model");
const router = require("express").Router();


router.post("/color-add", async(req, res)=> {
    try {
        const newColor = await new colorModel(req.body).save();
        return res.json({
            message:"Success",
            data: newColor
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message)
    }
});


router.get("/color-all", async(req, res) => {
    try {
        const colors = await colorModel.find();
        return res.json({
            message: "Success",
            data: colors
        })
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message)
    }
});


router.delete("/color-delete/:id", async(req, res) => {
    try {
        const deleteColor = await colorModel.findByIdAndDelete(req.params.id);
        return res.json(deleteColor)
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message)

    }
})






module.exports = router;