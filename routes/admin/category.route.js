const { checkToken } = require("../../middlewares/authMiddleware")
const categoryController = require('../../controllers/admin/category.controller')

const categoryRoutes = async (fastify, options) => {
 try {
       // Create new Category 
       fastify.post("/category-add", { preHandler: checkToken }, categoryController.create);

       // Get all category
       fastify.get("/category-all", { preHandler: checkToken }, categoryController.getAll);
   
       fastify.get("/category-parent/:id",{ preHandler: checkToken }, categoryController.getAllByParentId);
   
       // Get by Id Category 
       fastify.get("/category-id/:id", { preHandler: checkToken }, categoryController.oneById)
   
       // Get by slug Category 
       fastify.get("/category-slug/:slug", { preHandler: checkToken }, categoryController.oneBySlug)
   
       // edit category by id
       fastify.put("/category-edit/:id",{ preHandler: checkToken }, categoryController.updateById);
   
       // delete Category by id
       fastify.delete("/category-delete/:id", { preHandler: checkToken }, categoryController.deleteById);
   
   }
  catch (error) {
   console.log(error); 
 }

}

module.exports = categoryRoutes;