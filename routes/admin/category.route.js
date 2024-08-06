const router = require("express").Router();
const { checkToken } = require("../../middlewares/authMiddleware")
const categoryController = require('../../controllers/category.controller') 

// Create new Category 
router.post("/category-add", checkToken, categoryController.create);

// Get all category
router.get("/category-all/:id", checkToken, categoryController.getAllByParentId);

// Get by Id Category 
router.get("/category-id/:id", checkToken, categoryController.oneById)

// Get by slug Category 
router.get("/category-slug/:slug", checkToken, categoryController.oneBySlug)

// edit category by id
router.put("/category-edit/:id", checkToken, categoryController.updateById);

// delete Category by id
router.delete("/category-delete/:id", checkToken, categoryController.deleteById);


module.exports = router;