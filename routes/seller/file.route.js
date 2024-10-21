const { checkToken } = require("../../middlewares/authMiddleware");
const fileController = require("../../controllers/file.controller")


const fileRoutes = async (fastify, options) => {
    fastify.post("/image-upload", { preHandler: checkToken }, fileController.imageUpload)
    fastify.delete("/image-remove/:image_url", { preHandler: checkToken }, fileController.imageRemove)
}


module.exports = fileRoutes;

