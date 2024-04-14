const router = require("express").Router();
const { productModel } = require("../../models/product.model");
const { categoryModel } = require("../../models/category.model");

const slugify = require("slugify");
const langReplace = require("../../utils/langReplace");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");

// create new Product 
router.post("/product-add", async (req, res) => {
    const { images } = req.body;
    req.body.slug = slugify(req.body.name.uz);
    req.body.images = [];

    for (const image of images) {
        const data = await new Base64ToFile(req).bufferInput(image).save();
        req.body.images.push(data);
    }


    // for (const color of req.body.colors) {
    //         color.images =  await new Base64ToFile(req).bufferInput(color.images).save();
    //     }

    try {

        const newProduct = await new productModel(req.body).save();
        return res.status(200).json(newProduct);

    } catch (error) {
        console.log(error);
        const { images } = req.body;
        // if(colors?.length > 0) {
        //     for (const color of colors) {
        //         for (const image of color.images) {
        //             fs.unlink(
        //                 path.join(__dirname, `../uploads/${path.basename(image)}`),
        //                 (err) => err && console.log(err)    
        //             )
        //         }
        //     }
        // }

        if (images?.length > 0) {
            for (const image of images) {
                fs.unlink(
                    path.join(__dirname, `../uploads/${path.basename(image)}`),
                    (err) => err && console.log(err)
                )
            }
        }

        return res.status(500).json("serverda Xatolik")
    }
});

// get all products 
router.get("/product-all", async (req, res) => {
    try {
        let products = await productModel.find();
        return res.json(products);
    } catch (error) {
        console.log(error)
    }
});




// one product by id 
router.get("/product-one/:id", async (req, res) => {
    try {

        let product = await productModel.findOne({ _id: req.params.id })
        return res.status(200).json(product.toObject());
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Ishlamayapti");
    }
});



// update product 
router.put("/product-edit/:id", async (req, res) => {
    const id = req.params.id;
    req.body.slug = slugify(req.body.name.uz);
    const { images } = req.body;
    req.body.images = [];

    for (const image of images) {
        const data = await new Base64ToFile(req).bufferInput(image).save();
        req.body.images.push(data);
    }

    req.body.discount = parseInt(((req.body.orginal_price - req.body.sale_price) / req.body.orginal_price) * 100);

    try {
        const updated = await productModel.findByIdAndUpdate(req.params.id, req.body);
        res.status(200).json(updated);
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Xatosi: "+ error);
    }
});

// product image delete 
router.put("/product-image-delete", async (req, res) => {
    const { product_id, image_path } = req.body;
    const deleted = await productModel.updateOne({_id: product_id}, {$pull: {images: image_path}});
    const imagePath = path.join(__dirname, `../../uploads/${path.basename(image_path)}`);
  
    if(fs.existsSync(imagePath)) {
        fs.unlink(
            imagePath,
            (err) => err && console.log(err)
        )
    }

    return res.status(200).send("success")
})



router.delete("/product-delete/:id", async (req, res) => {
    try {
        const deleted = await productModel.findByIdAndDelete(req.params.id);
        const { images, colors } = deleted;

        if (colors.length > 0) {
            for (const color of colors) {
                for (const image of color.images) {
                    fs.unlink(
                        path.join(__dirname, `../uploads/${path.basename(image)}`),
                        (err) => err && console.log(err)
                    )
                }
            }
        }

        if (images.length > 0) {
            for (const image of images) {
                fs.unlink(
                    path.join(__dirname, `../uploads/${path.basename(image)}`),
                    (err) => err && console.log(err)
                )
            }
        }



        return res.status(200).json({ result: deleted });

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik")
    }
});


module.exports = router;



