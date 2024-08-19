const router = require("express").Router();
const productModel = require("../../models/product.model");
const categoryModel = require("../../models/category.model");
const slugify = require("slugify");
const langReplace = require("../../utils/langReplace");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { redisClient } = require("../../config/redisDB");
const shopProductModel = require("../../models/shop.product.model");
const { checkToken } = require("../../middlewares/authMiddleware")
const { transformAttributes } = require('../../utils/transformAttributes')
const { algolia } = require("../../config/algolia");
const { $ne } = require("sift");
const productsIndex = algolia.initIndex("products");

// get all products search
router.get("/products-search", async (req, res) => {
  try {

    const search = req.query.search || "";
    const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
    const limit = parseInt(req.query.limit, 10) || 5;
    const query = {};

    if (search) {
      const options = { page: page, hitsPerPage: limit };
      const { hits } = await productsIndex.search(search, options)

      const ids = hits.map(item => item.objectID)
      query._id = { $in: ids };
    }

    const totalDocuments = await productModel.countDocuments(query).exec()
    const totalPages = Math.ceil(totalDocuments / limit);

    const products = await productModel.find(query)
      .populate('categories', 'name slug')
      .select('name slug images keywords category')

    const data = {
      message: "success get products",
      data: products,
      limit,
      page,
      totalPages
    };
    return res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});




router.get("/products", async (req, res) => {
  try {

    const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
    const limit = parseInt(req.query.limit, 10) || 30;
    const { lang = '' } = req.headers;
    const { search = "", category_id = "", viewsCount, disCount, expensive, cheap } = req.query;

    const cacheKey = `product:${lang}:${search}:${page}:${limit}`;
    const cacheData = await redisClient.get(cacheKey);
    redisClient.FLUSHALL();

    if (cacheData) return res.json(JSON.parse(cacheData));

    const sort = {};
    viewsCount && (sort.viewsCount = Number(viewsCount))
    cheap && (sort.cheap = Number(cheap))
    expensive && (sort.expensive = Number(expensive))

    const populateSort = {};
    disCount && (populateSort.discount = -1)


    const populateQuery = {};
    disCount && (populateQuery.discount = { $exists: true, $ne: 0 })

    const query = {};
    if (search) {
      const options = { page: page, hitsPerPage: limit };
      const { hits } = await productsIndex.search(search, options)
      const ids = hits.map(item => item.objectID)
      query._id = { $in: ids };
    }


    function findMostFrequentCategory(arr) {
      const ids = arr.split(",");

      // Takrorlanishni hisoblash uchun obyekt yarating
      const countMap = ids.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});

      // Eng ko'p takrorlangan identifikatorni aniqlash
      const maxCountId = Object.keys(countMap).reduce((maxId, id) => {
        return countMap[id] > countMap[maxId] ? id : maxId;
      });

      return maxCountId;
    }

    // Misol uchun foydalanish
    const mostFrequentCategory = findMostFrequentCategory(category_id);
    if (category_id) query.categories = { $in: [mostFrequentCategory] };


    

    const result = await productModel.aggregate([
      { $match: query },  // Filtirlash uchun query
      // { $sample: { size: limit * page } },  // Tasodifiy hujjatlar olish
      {
        $facet: {
          totalCount: [{ $count: 'count' }], // Umumiy hujjatlar sonini hisoblash
          data: [
            { $sample: { size: limit } },
            { $skip: page * limit }, // Sahifalash
            { $limit: limit }, // Faqat kerakli hujjatlarni olish
            {
              $lookup: {
                from: 'shopproducts',
                let: { productId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$product', '$$productId'] } } },
                  {
                    $lookup: {
                      from: 'shops',
                      localField: 'shop',
                      foreignField: '_id',
                      as: 'shop'
                    }
                  },
                  { $unwind: '$shop' },
                  {
                    $project: {
                      sale_price: 1,
                      orginal_price: 1,
                      discount: 1,
                      shop: {
                        _id: 1,
                        name: 1,
                        slug: 1
                      }
                    }
                  }
                ],
                as: 'details'
              }
            },
            { $unwind: '$details' },
            {
              $project: {
                _id: 1,
                slug: 1,
                images: 1,
                keywords: `$keywords.${lang}`,
                name: `$name.${lang}`,
                disription: `$discription.${lang}`,
                details: 1
              }
            }
          ]
        }
      },
      {
        $project: {
          data: 1, // Hujjatlarni o'z ichiga oladi
          totalPages: {
            $ceil: { $divide: [{ $arrayElemAt: ['$totalCount.count', 0] }, limit] } // Umumiy sahifalar sonini hisoblash
          }
        }
      }
    ]);
    
    const data = {
      message: "success get products",
      products: result[0].data,
      limit,
      page,
      totalPages: result[0].totalPages
    };

    await redisClient.SETEX(cacheKey, 3600, JSON.stringify(data));
    return res.json(data);

  } catch (error) {
    console.error(error);
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
  const search = req.query.search || "";
  const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
  const limit = parseInt(req.query.limit, 10) || 10;


  redisClient.FLUSHALL()
  const cacheKey = `product:${lang}:${slug}:${sku}`;
  const cacheData = await redisClient.get(cacheKey)
  if (cacheData) return res.json(JSON.parse(cacheData))
  const searchTerms = req.query.search?.split(",") || [];
  const regexTerms = searchTerms.map(term => new RegExp(term, 'i'));

  try {

    let user_id = req.headers['user'];
    user_id = (user_id === "null") ? null : (user_id === "undefined") ? undefined : user_id;

    let product;

    if (!variantQuery?.length) {
      const update = {
        $inc: { viewsCount: 1 },
        $addToSet: { views: user_id } // user_id mavjud bo'lmasa qo'shadi
      };

      product = await productModel.findOneAndUpdate(
        { "slug": slug },
        update,
        { new: true, useFindAndModify: false }
      );

    }




    product = await productModel.findOne({ slug: slug })
      .populate({
        path: "categories",
        select: ['name', 'slug'],
      })

      .populate({
        path: "details",
        populate: [
          {
            path: "shop",
            select: ['slug', 'name']
          },
          {
            path: "variants",
            populate: {
              path: "variant"
            }
          }
        ]
      })


    const attributes = transformAttributes((product?.details || []).flatMap(item => item.variants || []));

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
      details = product?.details;
    }

    const data = {
      data: {
        attributes,
        product,
        details: product?.details,
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


