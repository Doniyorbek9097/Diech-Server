// const router = require("express").Router();
const categoryController = require("../../controllers/client/category.controller")

const categoryRoutes = async(router, options) => {
// Get prent all category
router.get("/categories", categoryController.all);
// Get by slug name 
router.get("/category-slug/:slug", categoryController.oneBySlug)
// get home page 
router.get("/categories-with-home", categoryController.withHome);


}

module.exports = categoryRoutes;