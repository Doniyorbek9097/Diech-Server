const bannerModel = require("../../models/banner.model");
const bannerController = require("../../controllers/admin/banner.controller")

const bannerRoutes = async (fastify, options) => {
    fastify.post("/banner-add", bannerController.create);
    fastify.get("/banner-all", bannerController.all);
    fastify.delete("/banner-delete/:id", bannerController.deleteById)
    fastify.post("/banner-image-upload", (req, res) => fileController.imageUpload(req, res, { width: undefined }))

}

module.exports = bannerRoutes;