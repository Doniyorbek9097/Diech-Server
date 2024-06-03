const router = require("express").Router();
const { productModel } = require("../../models/product.model");
const { shopProductModel } = require("../../models/shop.products.model");
const categoryModel = require("../../models/category.model")
const slugify = require("slugify");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { checkToken } = require("../../middlewares/authMiddleware")



// create new Product 
router.post("/product-add", checkToken, async (req, res) => {

    try {
        const newProduct = await new shopProductModel(req.body).save();
        return res.status(200).json(newProduct);

    } catch (error) {
        console.log(error);
        return res.status(500).json("serverda Xatolik")
    }
});

// get all products 
router.get("/product-all", async (req, res) => {
    try {
        const { category_id, brend_id } = req.query;
        let query = {};
        if (category_id) query.categories = { $in: [category_id] };
        if (brend_id) query.brend = brend_id;
        let products = await productModel.find(query);
        if(products.length) return res.json(products);
        return res.json([])
    } catch (error) {
        console.log(error)
    }
});




// one product by id 
router.get("/product-one/:id", checkToken, async (req, res) => {
    try {

        let product = await shopProductModel.findOne({ _id: req.params.id })
        return res.status(200).json(product.toObject());
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Ishlamayapti");
    }
});



// update product 
router.put("/product-edit/:id", checkToken, async (req, res) => {
    req.body.slug = slugify(req.body.name.uz);
    const { images, deletedImages } = req.body;
    req.body.images = [];

    for (const image of images) {
        const data = await new Base64ToFile(req).bufferInput(image).save();
        req.body.images.push(data);
    }

    try {
        req.body.discount = parseInt(((req.body.orginal_price - req.body.sale_price) / req.body.orginal_price) * 100);

        const updated = await shopProductModel.findByIdAndUpdate(req.params.id, req.body);
        if(deletedImages.length > 0) {
            deletedImages.forEach(element => {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(element)}`);
                fs.unlink(imagePath, (err) => err && console.log(err))
            });
        }

        await updated.save();
        res.status(200).json(updated);

        
    } catch (error) {
        for (const image of req.body.images) {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(image)}`);
            fs.unlink(imagePath, (err) => err && console.log(err))
        }

        console.log(error);
        res.status(500).send("Server Xatosi: "+ error);
        
    }
});



router.delete("/product-delete/:id", checkToken, async (req, res) => {
    try {
        const deleted = await shopProductModel.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message:"success deleted!", data: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});


module.exports = router;



