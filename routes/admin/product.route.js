const router = require("express").Router();
const { checkToken } = require("../../middlewares/authMiddleware");
const productController = require("../../controllers/admin/product.controller")

// add product 
router.post("/product-add", checkToken, productController.add);

// get all products 
router.get("/product-all", checkToken, productController.all)    

// get one by id 
router.get("/product-one/:id", checkToken, productController.oneById);

// update by id 
router.put("/product-edit/:id", checkToken, productController.updateById);

//delete by id
router.delete("/product-delete/:id", checkToken, productController.deleteById);

router.get("/product-all-indexed", productController.indexed)


module.exports = router;



