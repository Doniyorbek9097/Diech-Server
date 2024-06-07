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


// create new Product 
router.post("/product-add", checkToken, async (req, res) => {
    await redisClient.FLUSHALL()
    const { images, parentCategory, subCategory, childCategory } = req.body;
    req.body.slug = slugify(req.body.name.uz);
    req.body.images = [];
    req.body.categories.push(parentCategory, subCategory, childCategory);
    
    if(images?.length) {
        for (const image of images) {
            const data = await new Base64ToFile(req).bufferInput(image).save();
            req.body.images.push(data);
        }
    }

    try {
        let newProduct = await new productModel(req.body).save();
        newProduct = await newProduct.populate({
            path:'categories',
            populate: {
                path:'children'
            }
        })

        return res.status(200).json(newProduct);

    } catch (error) {
        console.log(error);
        const { images } = req.body;
        if (images?.length > 0) {
            for (const image of images) {
                fs.unlink(
                    path.join(__dirname, `../../uploads/${path.basename(image)}`),
                    (err) => err && console.log(err)
                )
            }
        }

        return res.status(500).json("serverda Xatolik")
    }
});

// get all products 
router.get("/product-all", checkToken, async (req, res) => {
    try {
        let products = await productModel.find();

    products = products.map(product => {
            const inStock = product.variants.length ? product.variants.reduce((count, item) => count += item.inStock, 0) : product.inStock;
            const inStockVariants = product.variants.reduce((acc, item) => acc.concat({sku: item.sku, count: item.inStock}), []);
            const sold = product.variants.length ? product.variants.reduce((count, item) => count += item.soldOutCount, 0) : product.soldOutCount;
            const sold_variants = product.variants.reduce((acc, item) => acc.concat({sku: item.sku, count: item.soldOutCount}), []);
            const returned = product.variants.length ? product.variants.reduce((count, item) => count += item.returnedCount, 0) : product.returnedCount;
            const returned_variants = product.variants.reduce((acc, item) => acc.concat({sku: item.sku, count: item.returnedCount}), []);
            const views = product.viewsCount;
            return {
                _id: product._id,
                name: product.name,
                inStock,
                inStockVariants,
                sold,
                sold_variants,
                returned,
                returned_variants,
                views
            }
        })

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

    const { images, deletedImages, variants, parentCategory, subCategory, childCategory } = req.body;
    
    
    let product = {};
    if(variants.length) product = {...variants[0], ...req.body};
    else product = {...req.body};

    product.categories.push(parentCategory, subCategory, childCategory);

    product.images = [];

    if(images.length) {
        for (const image of images) {
            const data = await new Base64ToFile(req).bufferInput(image).save();
            product.images.push(data);
        }   
    }

    if(product?.attributes?.length) {
        for (const attr of product?.attributes) {
            for (const child of attr.children) {
            let images = [];
                for (const image of child.images) {
                    images.push(await new Base64ToFile(req).bufferInput(image).save())
                }

                child.images = images;
            }
        }
    }
    

    try {
        product.discount = parseInt(((product.orginal_price - product.sale_price) / product.orginal_price) * 100);
        if(isNaN(product.discount)) product.discount = 0;
        const updated = await productModel.findByIdAndUpdate(req.params.id, product);
        if(deletedImages?.length > 0) {
            deletedImages.forEach(element => {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(element)}`);
                fs.unlink(imagePath, (err) => err && console.log(err))
            });
        }

        res.json(updated);
        
    } catch (error) {
        for (const image of product?.images) {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(image)}`);
            fs.unlink(imagePath, (err) => err && console.log(err))
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
        const { images, colors } = deleted;

        // if (colors.length > 0) {
        //     for (const color of colors) {
        //         for (const image of color.images) {
        //             fs.unlink(
        //                 path.join(__dirname, `../uploads/${path.basename(image)}`),
        //                 (err) => err && console.log(err)
        //             )
        //         }
        //     }
        // }

        (images.length > 0) && images.forEach(item => {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(item)}`);
            fs.unlink(imagePath, (err) => err && console.log(err))
        }) 

        return res.status(200).json({ result: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});


module.exports = router;



