const router = require("express").Router();
const { productModel, reviewModel } = require("../../models/product.model");
const categoryModel = require("../../models/category.model");
const slugify = require("slugify");
const langReplace = require("../../utils/langReplace");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { redisClient } = require("../../config/redisDB");
const { shopProductModel } = require("../../models/shop.products.model");
const { checkToken } = require("../../middlewares/authMiddleware")


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
    const {lang = ''} = req.headers;

    const cacheKey = `product:${lang}`;
    const cacheData = await redisClient.get(cacheKey)
    if (cacheData) return res.json(JSON.parse(cacheData))
  
    let products = await shopProductModel.find({ slug: { $regex: search, $options: "i" } })
      .select('name slug images orginal_price sale_price discount reviews rating viewsCount attributes variants')
      .populate("product", "name slug images")
      .populate("shop", "name slug")
      .sort(matchSorted)
      .limit(limit)
      .skip(page * limit)

      const data = {
        data: products,
        message: "success"
      }

      redisClient.SETEX(cacheKey, 3600, JSON.stringify(data))
      res.json(data);

  } catch (error) {
    console.log(error)
    res.status(500).json(error.message)
  }
});



// one product by slug
router.get("/product-slug/:slug", async (req, res) => {
  const {sku = ''} = req.query;
  const {slug = '' } = req.params;
  const {lang = ''} = req.headers;
  redisClient.FLUSHALL()
  const cacheKey = `product:${lang}:${slug}:${sku}`;
  const cacheData = await redisClient.get(cacheKey)
  if (cacheData) return res.json(JSON.parse(cacheData))

  const searchTerms = req.query.search?.split(",") || [];
const regexTerms = searchTerms.map(term => new RegExp(term, 'i'));

  try {
    let product = await shopProductModel.findOne({ slug, keywords:{ $in: searchTerms } })
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
      .populate({
        path:"product",
        
      })
      .populate({
        path:"variants.attributes",
          populate: [
              {
                  path:"option",
                  select:["label"]
              },
              {
                  path:"value",
                  select:["label","option_id"]

              },
          ]
      })

    console.log(product);

      let user_id = req.headers['user'];
    user_id = (user_id === "null") ? null : (user_id === "undefined") ? undefined : user_id;

    user_id && !product.views.includes(user_id) && (product.views.push(user_id), product.viewsCount++);
    await product.save()

    // const variant = product.variants.find(item => item.sku.toLowerCase() == sku.toLowerCase());

    const products = await shopProductModel.find({ product: product.product._id, slug: { $ne: product.slug } })
      .populate('shop', 'name slug')
      .select('name slug discount orginal_price sale_price reviews')

    const data = {
      data: {
        _id: product._id,
      name: product.product.name,
      discription: product.product.discription,
      images: product.product.images,
      properteis: product?.product.properteis,
      rating: product.rating,
      reviews: product.reviews,
      viewsCount: product.viewsCount,
      orginal_price: product?.orginal_price,
      sale_price:  product?.sale_price,
      inStock: product?.inStock,
      discount: product?.discount,
      soldOutCount: product?.soldOutCount,
      attributes: product?.attributes,
      variants: product?.variants,
      brend: product?.brend,
      shop: product?.shop,
      categories: product.categories,
      shop_products: products
      },
        message:"success"
    };

    redisClient.SETEX(cacheKey, 3600, JSON.stringify(data));
    return res.json(data);

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



