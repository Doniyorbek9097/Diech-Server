const router = require("express").Router();
const pointModel = require("../../models/point.model");

router.post("/point-add", async (req, res) => {
    try {
        const newPoint = await new pointModel(req.body).save();
        
        res.json({
            message:"success",
            data: newPoint
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json(error.message)

    }
})


router.get("/point-all", async (req, res) => {
    try {
        const points = await pointModel.find();
        res.json({
            message: "success",
            data: points
        })

    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})


router.get("/point-delete/:id", async (req, res) => {
    try {
        const deleted = await pointModel.findByIdAndDelete(req.params.id);
        res.json({
            message: "success",
            data: deleted
        })

    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})



module.exports = router;