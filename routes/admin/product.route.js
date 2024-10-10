const { checkToken } = require("../../middlewares/authMiddleware");
const productController = require("../../controllers/admin/product.controller");
const productModel = require("../../models/product.model");
const shopProductModel = require("../../models/shop.product.model");

const productRoutes = async (fastify, options) => {
    try {
        // add product 
        fastify.post("/product-add", { preHandler: checkToken }, productController.add);

        // get all products 
        fastify.get("/product-all", productController.all)

        // get one by id 
        fastify.get("/product-one/:id", { preHandler: checkToken }, productController.oneById);

        // update by id 
        fastify.put("/product-edit/:id", { preHandler: checkToken }, productController.updateById);

        //delete by id
        fastify.delete("/product-delete/:id", { preHandler: checkToken }, productController.deleteById);

        fastify.post("/prodct-image-upload", productController.imageUpload)
        fastify.delete("/product-image-remove/:id", productController.imageRemove)
        fastify.get("/images", productController.productImage)
        fastify.get("/product-all-indexed", productController.indexed)

        fastify.post("/images-replace", async(req, reply) => {
            try {
                const { id, images } = req.body;
                await productModel.findByIdAndUpdate(id, { images })
                await shopProductModel.findOneAndUpdate({parent: id}, { images })
                return reply.send("success")

            } catch (error) {
                console.log(error);
                
            }
        })

    } catch (error) {
        console.log(error);
    }
}


module.exports = productRoutes;



