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
const { transformAttributes } = require('../../utils/transformAttributes')



// get all products search
router.get("/products-search", async (req, res) => {
  try {
    const page = parseInt(req.query?.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 10;
    const ratingFilter = req.query.rating;
    const soldFilter = req.query.sold;
    const search = req.query.search || "";

    const { lang = '' } = req.headers;

    let query = {};
    
    if (search) {
      const regex = new RegExp(`^${search}`, 'i');
      query = {
        $or: [
          { 'keywords': { $elemMatch: { $regex: regex } } },
          { 'name.uz': regex },
          { 'name.ru': regex },
          { 'barcode': regex }
        ]
      };
    }

    // Construct matchSorted with conditional checks
    let matchSorted = {};
    if (soldFilter) matchSorted.soldOut = soldFilter;
    if (ratingFilter) matchSorted.rating = ratingFilter;
    const cacheKey = `product:${lang}:${search}:${page}:${limit}:${ratingFilter}:${soldFilter}`;
    const cacheData = await redisClient.get(cacheKey);
    if (cacheData) return res.json(JSON.parse(cacheData));

    let products = await productModel.find(query)
      .select('name slug keywords categories')
      .populate('categories','slug name')
      .sort(matchSorted)
      .limit(limit)
      .skip(page * limit);

    const data = {
      data: products,
      message: "success"
    };

    await redisClient.SETEX(cacheKey, 3600, JSON.stringify(data));
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});


// get all products 
router.get("/products", async (req, res) => {
  try {
    const page = parseInt(req.query?.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 10;
    const ratingFilter = req.query.rating;
    const soldFilter = req.query.sold;
    const search = req.query.search || "";

    const { lang = '' } = req.headers;

    let query = {};
    
    if (search) {
      const regex = new RegExp(`^${search}`, 'i');
      query = {
        $or: [
          { 'keywords': { $elemMatch: { $regex: regex } } },
          { 'name.uz': regex },
          { 'name.ru': regex },
          { 'barcode': regex }
        ]
      };
    }

    // Construct matchSorted with conditional checks
    let matchSorted = {};
    if (soldFilter) matchSorted.soldOut = soldFilter;
    if (ratingFilter) matchSorted.rating = ratingFilter;
    const cacheKey = `product:${lang}:${search}:${page}:${limit}:${ratingFilter}:${soldFilter}`;
    const cacheData = await redisClient.get(cacheKey);
    if (cacheData) return res.json(JSON.parse(cacheData));

    let products = await productModel.find(query)
      .select('name slug images keywords categories')
      .populate('categories')
      .populate({ 
          path: "details",
          populate: {
              path: "shop", 
              select: ['name', 'slug']
          }
      })
      .sort(matchSorted)
      .limit(limit)
      .skip(page * limit);

    
    const data = {
      data: products,
      message: "success"
    };

    await redisClient.SETEX(cacheKey, 3600, JSON.stringify(data));
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});


// one product by slug
router.get("/product-slug/:slug", async (req, res) => {
  let variantQuery = [];
  req.query?.variant && (variantQuery = req.query?.variant?.split('-') || []);
  const { sku = '' } = req.query;
  const { slug = '' } = req.params;
  const { lang = '' } = req.headers;

  redisClient.FLUSHALL()
  const cacheKey = `product:${lang}:${slug}:${sku}`;
  const cacheData = await redisClient.get(cacheKey)
  if (cacheData) return res.json(JSON.parse(cacheData))
  const searchTerms = req.query.search?.split(",") || [];
  const regexTerms = searchTerms.map(term => new RegExp(term, 'i'));

  try {
    let product = await productModel.findOne({ slug: slug })
      .populate({
        path: "categories",
        select: ['name', 'slug'],
      })
      .populate("brend", "name slug")
      .populate({
        path: "details",
        populate: [
          {
            path: "shop",
            select:['slug','name']
          },
          {
            path: "variants",
            populate: {
              path: "variant"
            }
          }
        ]
      })


          let user_id = req.headers['user'];
        user_id = (user_id === "null") ? null : (user_id === "undefined") ? undefined : user_id;
        if(user_id) {
          user_id && !product.views.includes(user_id) && (product.views.push(user_id), product.viewsCount++);
          await product.save()
        }

    const attributes = transformAttributes(product.details.flatMap(item => item?.variants || []));

    const matchesFilter = variant =>
      variantQuery.every(query =>
        variant.attributes.some(attr => attr.value === query)
      );

    let variants;

    //  Filter variants by SKU
    if (variantQuery.length) {
      const details = product.details.filter(detail =>
        detail.variants.some(item => {
          item.shop = detail.shop;
          return matchesFilter(item.variant);
        })
      );

      variants = details?.flatMap(detail =>
        detail?.variants
          .filter(item => (item.shop = detail.shop, matchesFilter(item.variant)))
      ) ?? [];

    } else {
      details = product.details;
    }


    const data = {
      data: {
        attributes,
        product,
        details: product.details,
        variants,
        isVariant: !!variants
      },
      message: "success"
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


