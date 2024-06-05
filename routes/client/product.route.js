const router = require("express").Router();
const {productModel, reviewModel} = require("../../models/product.model");
const categoryModel = require("../../models/category.model");
const slugify = require("slugify");
const langReplace = require("../../utils/langReplace");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { redisClient } = require("../../config/redisDB");
const { shopProductModel } = require("../../models/shop.products.model")


// get all products 
router.get("/products", async (req, res) => {
    try {

        const page = parseInt(req.query?.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const ratingFilter = req.query.rating;
        const soldFilter = req.query.sold;

        const matchSorted = {};
        matchSorted.soldOut = soldFilter;
        matchSorted.rating = ratingFilter;


        let products = await productModel.find({slug:{ $regex: search, $options: "i" } })
        .sort(matchSorted)
        .limit(limit)
        .skip(page * limit)
        .populate("shop_variants")
        

        return res.json({
          data: products,
          message: "success"
        });

    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
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

  let sku = req.query?.sku || "";
 
    try {
        let product = await shopProductModel.findOne({ slug: req.params.slug })
            .populate({
                path:"categories",
                populate: "children"
            })
            .populate("shop")
            .populate("brend")
            .populate('product')
        let user_id = req.headers['user'];
        user_id =  (user_id === "null") ? null : (user_id === "undefined") ? undefined : user_id;
        
        user_id && !product.views.includes(user_id) && (product.views.push(user_id), product.viewsCount++);
        await product.save()

      const variant = product.variants.find(item => item.sku.toLowerCase() == sku.toLowerCase());
      
      const products = await shopProductModel.find({name: product.name}).populate('shop')

      return res.json({
           data: {
            _id: product._id,
            name: product.product.name,
            discription: product.product.discription,
            images: product.product.images,
            properties: product?.product.properties,
            rating: product.rating,
            reviews: product.reviews,
            viewsCount: product.viewsCount,
            orginal_price: variant?.orginal_price || product?.orginal_price,
            sale_price: variant?.sale_price || product?.sale_price,
            inStock: variant?.inStock || product?.inStock,
            discount: variant?.discount || product?.discount,
            soldOutCount: variant?.soldOutCount || product?.soldOutCount,
            attributes: product?.attributes,
            variants: product?.variants,
            brend: product?.brend,
            shop: product?.shop,
            categories: product.categories,
            shop_products: products
           }, 
           message:"success"
        });

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
          name: user.username || user?.phone_number,
          rating: Number(rating),
          comment,
          user: user._id,
        }
        product.reviews.unshift(review);
    
        const totalRating = product.reviews.reduce((acc, item) => item.rating + acc, 0);
        product.rating = (totalRating / product.reviews.length).toFixed(1);

        // Ensure the rating is within the 0-5 range
        product.rating = Math.min(Math.max(product.rating, 0), 5);
        
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



