const router = require("express").Router();
const { productModel } = require("../../models/product.model");
const cartModel = require("../../models/cart.model")
const slugify = require("slugify");
const langReplace = require("../../utils/langReplace");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { checkToken } = require("../../middlewares/authMiddleware");
const { nestedVariant } = require("../../utils/nestedVariant");
const { removeDuplicates } = require("../../utils/removeDuplicates");
const { redisClient } = require("../../config/redisDB");
const { useUploadFolder } = require("../../config/uploadFolder");

const uploadFolder = useUploadFolder()

// create new Product 
router.post("/product-add", checkToken, async (req, res) => {
    await redisClient.FLUSHALL()
    const {body: product} = req;
    product.slug = slugify(product.name.uz);

    try {
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
            element && (imagePath = `${uploadFolder}/${path.basename(element)}`);
                fs.unlink(imagePath, (err) => err && console.log(err))
            });
        }

        return res.json(updated);
        
    } catch (error) {
        
        for (const image of product?.images) {

            const imagePath = path.join(__dirname, `${uploadFolder}/${path.basename(image)}`);
            fs.unlink(imagePath, (err) => err && console.log(err))
        }

        if(product?.attributes?.length) {
            for (const attr of product?.attributes) {
                for (const child of attr.children) {
                    for (const image of child.images) {
                        const imagePath = `${uploadFolder}/${path.basename(image)}`;
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
            
            const imagePath = `${uploadFolder}/${path.basename(item)}`;
            fs.unlink(imagePath, (err) => err && console.log(err))
        }) 

        if(deleted?.attributes?.length) {
            for (const attr of deleted?.attributes) {
                for (const child of attr.children) {
                    for (const image of child.images) {
                        const imagePath = path.join(__dirname, `${uploadFolder}/${path.basename(image)}`);
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



