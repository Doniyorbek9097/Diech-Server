// const router = require("express").Router();
const categoryController = require("../../controllers/client/category.controller")

const categoryRoutes = async(router, options) => {
// Get prent all category
router.get("/categories", categoryController.allTree);
router.get("/parent-categories", categoryController.allParent);

// Get by slug name 
router.get("/category-slug/:slug", categoryController.oneBySlug)
router.get("/category-products-filter/:category_id", categoryController.filterData)
router.get("/category-product-countes/:category_id", categoryController.totalProductCounts)

// get home page 
router.get("/categories-with-home", categoryController.withHome);


}

module.exports = categoryRoutes;