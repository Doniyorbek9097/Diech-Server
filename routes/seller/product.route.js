const router = require("express").Router();
const productModel = require("../../models/product.model");
const shopProductModel = require("../../models/shop.product.model");
const shopProductVariantModel = require("../../models/shop.product.variant.model")
const { checkToken } = require("../../middlewares/authMiddleware");
const { redisClient } = require("../../config/redisDB");



// create new Product 
router.post("/product-add", checkToken, async (req, res) => {
    redisClient.FLUSHALL()
    try {
        const {body: products} = req; 
        console.log(products);
        if (Array.isArray(products)) {
            for (const product of products) {
                product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
                if (isNaN(product.discount)) product.discount = 0;
            }
        }
        
        const newProduct = await shopProductModel.insertMany(products)
        return res.status(200).json({data: newProduct, message:"success added"});

    } catch (error) {
        console.log(error);
        return res.status(500).json("serverda Xatolik")
    }
});

// get all products 
router.get("/product-all", async (req, res) => {
    try {
        const { shop_id } = req.query;
        let products = await shopProductModel.find({shop: shop_id})
        .populate("product")

        res.json(products);

    } catch (error) {
        console.log(error)
    }
});


// get all search products 
router.get("/custom-products", async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = {
                $or: [
                    { 'name.uz': { $regex: search, $options: "i" } }, // name maydoni bo'yicha qidirish
                    { 'name.ru': { $regex: search, $options: "i" } }, // name maydoni bo'yicha qidirish
                    { 'barcode': { $regex: search, $options: "i" } },
                    { 'keywords': { $regex: search, $options: "i" } }, // keywords maydoni bo'yicha qidirish
                ]
            };
        }

        let products = await productModel.find(query)
        .limit(5)
        res.json(products);

    } catch (error) {
        console.log(error)
    }
});


router.get('/custom-product', async (req, res) => {
    const barcode = req.query?.barcode;
    const product = await productModel.findOne({barcode});
    if(!product) return res.json({message:"Mahsulot topilmadi"})
    console.log(product)
    return res.json({
        data:product,
        message:"Success"
    })
})


// one product by id 
router.get("/product-one/:id", checkToken, async (req, res) => {
    try {
        let product = await shopProductModel.findOne({ _id: req.params.id })
            .populate({
              path:"product",
              populate: {
                path:"variants",
              }   
            })
            .populate({
                  path:"variants",
                  populate: {
                      path:"variant"
                  }
              })
            
        return res.status(200).json(product);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Ishlamayapti");
    }
});



// update product 
router.put("/product-edit/:id", checkToken, async (req, res) => {
    try {
        redisClient.FLUSHALL()

        const { variants } = req.body
        let product = req.body;
        if (variants.length) {
            variants.forEach(item => {
                item.discount = parseInt(((item.orginal_price - item.sale_price) / item.orginal_price) * 100);
            })
        } 

        product.variants = variants;
        product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
        const updated = await shopProductModel.findByIdAndUpdate(req.params.id, product);
        
        res.status(200).json(updated);

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Xatosi: " + error);

    }
});



router.delete("/product-delete/:id", checkToken, async (req, res) => {
    try {
        redisClient.FLUSHALL()

        const deleted = await shopProductModel.findByIdAndDelete(req.params.id).populate('variants')
        for (const variant of deleted.variants) {
           await shopProductVariantModel.deleteMany({_id: variant._id})
        }
        
        return res.status(200).json({ message: "success deleted!", data: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});



module.exports = router;



