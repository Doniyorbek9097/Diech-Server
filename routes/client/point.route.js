// const router = require("express").Router();
const pointModel = require("../../models/point.model");

const pointRoutes = async(router, options) => {
    router.get("/point-all", async (req, res) => {
        try {
            const points = await pointModel.find();
            return {
                message: "success",
                data: points
            }
    
        } catch (error) {
            console.log(error)
            res.status(500).send(error.message)
        }
    })
}


module.exports = pointRoutes;