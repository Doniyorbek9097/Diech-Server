const bannerModel = require("../../models/banner.model");
const bannerController = require("../../controllers/admin/banner.controller")
const fileController = require("../../controllers/file.controller")

const bannerRoutes = async (fastify, options) => {
    fastify.post("/banner-add", bannerController.create);
    fastify.get("/banner-all", bannerController.all);
    fastify.delete("/banner-delete/:id", bannerController.deleteById)
    fastify.post("/banner-large-image-upload", (req, res) => fileController.imageUpload(req, res, { width: 1350 }))
    fastify.post("/banner-min-image-upload", (req, res) => fileController.imageUpload(req, res, { width: 1152 }))
    
}

module.exports = bannerRoutes;