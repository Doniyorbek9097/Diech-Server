const router = require("express").Router();
const { checkToken } = require("../../middlewares/authMiddleware");
const productController = require("../../controllers/admin/product.controller")
const productModel = require("../../models/product.model")

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

router.get("/remove-keywords", async (req, res) => {
    const result = await productModel.updateMany(
        {}, // Qidiruv kriteriyalari: bu yerda barcha hujjatlar tanlanadi
        { $unset: { keywords: "" } } // $unset operatori bilan keywords fieldini o'chirib tashlaymiz
      );

      res.send("success")
})

module.exports = router;



