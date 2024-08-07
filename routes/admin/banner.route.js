const bannerModel = require("../../models/banner.model");
const router = require("express").Router()
const bannerController = require("../../controllers/admin/banner.controller")

router.post("/banner-add", bannerController.create);

router.get("/banner-all", bannerController.all);

router.delete("/banner-delete/:id", bannerController.deleteById)


module.exports = router