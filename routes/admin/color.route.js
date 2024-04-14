const colorModel = require("../../models/color.model");
const langReplace = require("../../utils/langReplace");

const router = require("express").Router();


router.post("/add-color", async(req, res)=> {
    try {
        const newColor = await new colorModel(req.body).save();
        return res.status(201).json(newColor);
    } catch (error) {
        console.log(error);
    }
});


router.get("/colors", async(req, res) => {
    try {
        const colors = await colorModel.find();
        return res.status(200).json(colors)
    } catch (error) {
        console.log(error);
    }
});


router.delete("/delete-color/:id", async(req, res) => {
    try {
        const deleteColor = await colorModel.findByIdAndDelete(req.params.id);
        return res.status(200).json(deleteColor)
    } catch (error) {
        console.log(error);
    }
})






module.exports = router;