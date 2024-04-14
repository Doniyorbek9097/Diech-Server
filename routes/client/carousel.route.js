const carouselModel = require("../../models/carousel.model");
const router = require("express").Router();




router.get("/carousel-all", async(req,res) => {
    try {       
        let result = await carouselModel.find();
       return res.status(200).json(result);

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message)
    }
});



module.exports = router;