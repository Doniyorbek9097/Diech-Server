const { checkToken } = require("../../middlewares/authMiddleware");
const productController = require("../../controllers/admin/product.controller")

const productRoutes = async (fastify, options) => {
    try {
        // add product 
        fastify.post("/product-add", { preHandler: checkToken }, productController.add);

        // get all products 
        fastify.get("/product-all", { preHandler: checkToken }, productController.all)

        // get one by id 
        fastify.get("/product-one/:id", { preHandler: checkToken }, productController.oneById);

        // update by id 
        fastify.put("/product-edit/:id", { preHandler: checkToken }, productController.updateById);

        //delete by id
        fastify.delete("/product-delete/:id", { preHandler: checkToken }, productController.deleteById);

        fastify.get("/product-all-indexed", productController.indexed)
        fastify.get("/convert-images", productController.convertImagesToWebp)

        fastify.get("/convert-images-delete", productController.deletedImagesLink)
    } catch (error) {
        console.log(error);
    }
}


module.exports = productRoutes;



