const router = require("express").Router();
const { productModel } = require("../../models/product.model");
const cartModel = require("../../models/cart.model")
const slugify = require("slugify");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { checkToken } = require("../../middlewares/authMiddleware");
const { redisClient } = require("../../config/redisDB");
const { baseDir } = require("../../config/uploadFolder");
const { generateOTP } = require("../../utils/otpGenrater"); 
const { upload } = require("../../middlewares/upload")

// create new Product 

router.get("/upload/:id", async (req, res) => {
    try {
        const productId = req.params.id; // Replace with your product ID logic
        const product = await productModel.findById(productId).select("images")
        return res.json(product);

    } catch (error) {
        console.log(error);
    }
})


router.put("/upload/:id", upload.array('images', 10),  async (req, res) => {
    try {
        const images = req.files.map(file => `${req.protocol}://${req.headers.host}/uploads/${file.filename}`);
        const productId = req.params.id; 
        const product = await productModel.findById(productId).select('images')
        product.images.push(...images)
        await product.save()
        return res.json(product.images);

    } catch (error) {
        console.log(error);
    }
})


router.post("/product-add", checkToken, async (req, res) => {
    await redisClient.FLUSHALL()
    const {body: product} = req;
    product.slug = slugify(`${product.name.ru.toLowerCase()}`)

    try {
        const existsProduct = await productModel.findOne({slug: product.slug})
        if(existsProduct) {
            return res.json({
                message:"Bunday product mavjud!"
            })
        }

        let newProduct = await new productModel(product).save();
        return res.status(200).json(newProduct);

    } catch (error) {
        console.log(error);
        return res.status(500).json("serverda Xatolik")
    }
});

// get all products 
router.get("/product-all", checkToken, async (req, res) => {
    try {
        let products = await productModel.find();

    // products = products.map(product => {
    //         const inStock = product.variants.length ? product.variants.reduce((count, item) => count += item.inStock, 0) : product.inStock;
    //         const inStockVariants = product.variants.reduce((acc, item) => acc.concat({sku: item.sku, count: item.inStock}), []);
    //         const sold = product.variants.length ? product.variants.reduce((count, item) => count += item.soldOutCount, 0) : product.soldOutCount;
    //         const sold_variants = product.variants.reduce((acc, item) => acc.concat({sku: item.sku, count: item.soldOutCount}), []);
    //         const returned = product.variants.length ? product.variants.reduce((count, item) => count += item.returnedCount, 0) : product.returnedCount;
    //         const returned_variants = product.variants.reduce((acc, item) => acc.concat({sku: item.sku, count: item.returnedCount}), []);
    //         const views = product.viewsCount;
    //         return {
    //             _id: product._id,
    //             name: product.name,
    //             inStock,
    //             inStockVariants,
    //             sold,
    //             sold_variants,
    //             returned,
    //             returned_variants,
    //             views
    //         }
    //     })

        return res.json(products);
    } catch (error) {
        console.log(error)
    }
});




// one product by id 
router.get("/product-one/:id", checkToken, async (req, res) => {
    try {
        let product = await productModel.findOne({ _id: req.params.id })
        return res.status(200).json(product.toObject());
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Ishlamayapti");
    }
});



// update product 
router.put("/product-edit/:id", checkToken, async (req, res) => {
    await redisClient.FLUSHALL()

    const { body: product } = req;    
   
    if(product.images.length) {
        let images = [];
        for (const image of product.images) {
            const data = await new Base64ToFile(req).bufferInput(image).save();
            images.push(data);
        }   
        product.images = images;
    }


    try {

        const updated = await productModel.findByIdAndUpdate(req.params.id, product);
        if(product?.deletedImages?.length > 0) {
            console.log(product?.deletedImages)
            product.deletedImages.forEach(element => {
            let imagePath;
            element && (imagePath = `${baseDir}/${path.basename(element)}`);
                fs.unlink(imagePath, (err) => err && console.log(err))
            });
        }

        return res.json(updated);
        
    } catch (error) {
        
        for (const image of product?.images) {

            const imagePath = path.join(__dirname, `${baseDir}/${path.basename(image)}`);
            fs.unlink(imagePath, (err) => err && console.log(err))
        }

        if(product?.attributes?.length) {
            for (const attr of product?.attributes) {
                for (const child of attr.children) {
                    for (const image of child.images) {
                        const imagePath = `${baseDir}/${path.basename(image)}`;
                        fs.unlink(imagePath, (err) => err && console.log(err))
                    }
                }
            }
        }

        console.log(error);
        res.status(500).send("Server Xatosi: "+ error);
    }
});



router.delete("/product-delete/:id", checkToken, async (req, res) => {
    try {
        redisClient.FLUSHALL()
        const deleted = await productModel.findByIdAndDelete(req.params.id);
        await cartModel.deleteMany({'products.product': deleted._id})
        const { images } = deleted;

        (images.length > 0) && images.forEach(item => {
            
            const imagePath = `${baseDir}/${path.basename(item)}`;
            fs.unlink(imagePath, (err) => err && console.log(err))
        }) 

        if(deleted?.attributes?.length) {
            for (const attr of deleted?.attributes) {
                for (const child of attr.children) {
                    for (const image of child.images) {
                        const imagePath = path.join(__dirname, `${baseDir}/${path.basename(image)}`);
                        fs.unlink(imagePath, (err) => err && console.log(err))
                    }
                }
            }
        }

        return res.status(200).json({ result: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});





module.exports = router;



