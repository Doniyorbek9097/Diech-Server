const router = require("express").Router();
const pointModel = require("../../models/point.model");

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



module.exports = router;