const router = require("express").Router();
const {productModel, reviewModel} = require("../../models/product.model");
const categoryModel = require("../../models/category.model");
const slugify = require("slugify");
const langReplace = require("../../utils/langReplace");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");



// get all products 
router.get("/products", async (req, res) => {
    try {
        let products = await productModel.find()
        
        return res.json(products);
    } catch (error) {
        console.log(error)
    }
});


// search products 
// router.get("/product/:category", async (req, res) => {
//     try {
//         let lang = req.headers['lang'];
//         let categorySlug = req.params.category;
//         let products = await productModel.find()
//             .populate("parentCategory")
//             .populate("subCategory")
//             .populate("childCategory")
//             .populate("brend")

//         products = products.filter(product => {
//             if (product.parentCategory.slug == categorySlug) return product;
//             if (product.subCategory.slug == categorySlug) return product;
//             if (product.childCategory.slug == categorySlug) return product;

//         })

//         products = JSON.stringify(products);
//         products = JSON.parse(products);
//         if (!lang) return res.json({ result: products });
//         products = langReplace(products, lang);
//         for (const product of products) {
//             // product.brend.discription = langReplace(product.brend?.discription, lang);
//             product.properteis = langReplace(product.properteis, lang);
//             product.parentCategory = langReplace(product.parentCategory, lang);
//             product.subCategory = langReplace(product.subCategory, lang);
//             product.childCategory = langReplace(product.childCategory, lang);

//         }
//         return res.json(products);
//     } catch (error) {
//         console.log(error)
//     }
// });



// one product by slug
router.get("/product-slug/:slug", async (req, res) => {
    try {

        let color = req.query.color || "";

        let product = await productModel.findOne({ slug: req.params.slug })
            .populate("parentCategory")
            .populate({
                path:"subCategory",
                populate: "subProducts"
            })
            .populate({
                path: "childCategory",
                populate: "childProducts"
            })
            .populate({
                path:"brend",
                populate: {
                    path:'products'
                }
            })
        .populate("owner", "username")
        .populate("shop");
        

        return res.status(200).json(product);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Ishlamayapti");
    }
});


router.post("/add-review/:id", async (req, res) => {
    try {
      const { rating, comment, user } = req.body;
      const product = await productModel.findById(req.params.id)
    
      if (product) {
        const alreadyReviewed = product.reviews.find(
          (r) => r.user.toString() == user._id.toString()
        )
    
        if (alreadyReviewed) {
          return res.status(400).send('Product already reviewed')
        }
    
        const review = {
          name: user.username,
          rating: Number(rating),
          comment,
          user: user._id,
        }
    
        product.reviews.unshift(review);
    
        product.rating =
          product.reviews.reduce((acc, item) => item.rating + acc, 0) /
          product.reviews.length;
    
       const newProduct = await product.save();
        res.status(201).json(newProduct.reviews.shift())

      } else {
        res.status(404)
        throw new Error('Product not found')
      }
    } catch (error) {
        console.log(error);
    }
});


router.post("/delete-review/:id", async(req, res) => {
  try {
    const product = await productModel.findById(req.params.id)
    if(product) {
        const index = product.reviews.findIndex(review => review._id == req.body.review_id);
        if(index !== -1) {
           product.reviews.splice(index, 1)
        await product.save()
        res.status(200).json({ message: 'Review deleted' })
        }

       else res.status(404).json("Product not found")
       
    }

    else {
      res.status(404).json("Product not found")
    }

  } catch (error) {
    console.log(error);
    res.status(500).json("Server is don't working")
    
  }
})

module.exports = router;



