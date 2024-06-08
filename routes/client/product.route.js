const router = require("express").Router();
const { productModel, reviewModel } = require("../../models/product.model");
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

    // const cacheKey = `product:${slug}:${sku}`;
    // const cacheData = await redisClient.get(cacheKey)
    // if (cacheData) return res.json(JSON.parse(cacheData))
  
    let products = await shopProductModel.find({ slug: { $regex: search, $options: "i" } })
      .select("name slug orginal_price sale_price discount product")
      .populate("product", "name slug images")
      .populate("shop", "name slug")
      .sort(matchSorted)
      .limit(limit)
      .skip(page * limit)

    return res.json({
      data: products,
      message: "success"
    });

  } catch (error) {
    console.log(error)
    res.status(500).json(error.message)
  }
});



// one product by slug
router.get("/product-slug/:slug", async (req, res) => {

  const {sku = ''} = req.query;
  const { slug = '' } = req.params;
  const cacheKey = `product:${slug}:${sku}`;
  const cacheData = await redisClient.get(cacheKey)
  if (cacheData) return res.json({
      data: JSON.parse(cacheData),
      message: "success"
    })

  try {
    let product = await shopProductModel.findOne({ slug })
      .populate({
        path: "categories",
        select: ['name', 'slug'],
        populate: {
          path: "children",
          select: ['name', 'slug']
        }
      })
      .populate("shop", "name slug")
      .populate("brend", "name slug")
      .populate('product')

    let user_id = req.headers['user'];
    user_id = (user_id === "null") ? null : (user_id === "undefined") ? undefined : user_id;

    user_id && !product.views.includes(user_id) && (product.views.push(user_id), product.viewsCount++);
    await product.save()

    const variant = product.variants.find(item => item.sku.toLowerCase() == sku.toLowerCase());

    const products = await shopProductModel.find({ name: product.name, slug: { $ne: product.slug } })
      .populate('shop', 'name slug')
      .select('name slug discount orginal_price sale_price attributes reviews')

    const data = {
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
    };

    redisClient.SETEX(cacheKey, 3600, JSON.stringify(data));

    return res.json({
      data,
      message: "success"
    });

  } catch (error) {
    console.log(error);
    return res.status(500).send("Server Ishlamayapti");
  }
});


router.post("/add-review/:id", async (req, res) => {
  await redisClient.FLUSHALL()
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


router.post("/delete-review/:id", async (req, res) => {
  await redisClient.FLUSHALL()

  try {
    const product = await productModel.findById(req.params.id)
    if (product) {
      const index = product.reviews.findIndex(review => review._id == req.body.review_id);
      if (index !== -1) {
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



