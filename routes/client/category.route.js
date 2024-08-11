const router = require("express").Router();
const categoryController = require("../../controllers/client/category.controller")

// Get prent all category
router.get("/categories", categoryController.all);
// Get by slug name 
router.get("/category-slug/:slug", categoryController.oneBySlug)


module.exports = router;