// const router = require("express").Router();
const productModel = require("../../models/product.model");
const categoryModel = require("../../models/category.model");
const slugify = require("slugify");
const langReplace = require("../../utils/langReplace");
const path = require("path")
const fs = require("fs");
const { Base64ToFile } = require("../../utils/base64ToFile");
const shopProductModel = require("../../models/shop.product.model");
const { checkToken } = require("../../middlewares/authMiddleware")
const { transformAttributes } = require('../../utils/transformAttributes')
const { algolia } = require("../../config/algolia");
const productsIndex = algolia.initIndex("products");
const mongoose = require("mongoose");


async function productRoutes(router, options) {
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

    return data;

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});


// all products 
router.get("/products", async (req, res) => {
  try {

    const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
    const limit = parseInt(req.query.limit, 10) || 10;
    const { lang = '' } = req.headers;
    const {
      search = "",
      category_id = "",
      viewsCount,
      disCount,
      price,
      random

    } = req.query;


    const sort = {};
  
    !!viewsCount && (sort.viewsCount = -1)
    price && (sort.price = Number(price))
    !!disCount && (sort.discount = -1)

    const query = {};
    disCount && (query.discount = { $exists: true, $ne: 0 })

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
    if (category_id) query.categories = { $in: [new mongoose.Types.ObjectId(mostFrequentCategory)] };


    let productsIds = [];
    Boolean(random) && (productsIds = await shopProductModel.getRandomProducts({ query, limit, sort, page }))
    productsIds.length && (query._id = { $in: productsIds })

    const totalDocuments = await shopProductModel.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);
    
    const result = await shopProductModel.find(query)
    .populate("shop")
    .sort(sort)
    .skip(page * limit)
    .limit(limit)
    .select("name slug disription images orginal_price sale_price discount reviews viewsCount shop")

    console.log(result[0]);
    
    const data = {
      message: "success get products",
      products: result,
      limit,
      page,
      totalPages
    };


    return data;

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
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

      product = await shopProductModel.findOneAndUpdate(
        { "slug": slug },
        update,
        { new: true, useFindAndModify: false }
      );

    }




    product = await shopProductModel.findOne({ slug: slug })
      .populate("categories", "name slug")
      // .populate("shop","slug name")
      .populate({
          path: "variants",
          populate: {
            path: "variant"
          }
      })

    console.log(product);
    // const attributes = transformAttributes((product?.details || []).flatMap(item => item.variants || []));

    // const matchesFilter = variant =>
    //   variantQuery.every(query =>
    //     variant.attributes.some(attr => attr.value === query)
    //   );

    // let variants;

    // //  Filter variants by SKU
    // if (variantQuery.length) {
    //   const details = product.details.filter(detail =>
    //     detail.variants.some(item => {
    //       item.shop = detail.shop;
    //       return matchesFilter(item.variant);
    //     })
    //   );

    //   variants = details?.flatMap(detail =>
    //     detail?.variants
    //       .filter(item => (item.shop = detail.shop, matchesFilter(item.variant)))
    //   ) ?? [];

    // } else {
    //   details = product?.details;
    // }

    let firstCategory = product.categories[0];
    let lastCategory = product.categories[product.categories.length - 1];

    const getCategoryProducts = async (category) => {
      const [result] = await shopProductModel.aggregate([
        { $match: { categories: { $in: [category._id] } } },  // Kategoriyaga mos mahsulotlarni topish
        { $sample: { size: limit } },  // Randomlashtirish
        { $project: { _id: 1 } },  // Faqat _id maydonini qaytarish
        { $group: { _id: null, ids: { $push: '$_id' } } },  // _idlarni arrayga yig'ish
        { $project: { _id: 0, ids: 1 } }  // Yig'ilgan arrayni qaytarish
      ]);
  
      const randomProductIds = result ? result.ids : [];
      const products = await shopProductModel.find({ _id: { $in: randomProductIds } })
      .populate("categories", "name slug")
      // .populate("shop","slug name")
      .populate({
          path: "variants",
          populate: {
            path: "variant"
          }
      })
      .limit(limit)

        return products;
  
    }

    const lastCategoryProducts = await getCategoryProducts(lastCategory)
    const firstCategoryProducts = await getCategoryProducts(firstCategory)

    const data = {
      data: {
        product,
        firstCategoryProducts,
        lastCategoryProducts,
      },
      message: "success"
    };

    return data;

  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
});


// addrewies 

router.post("/add-review/:id", async (req, res) => {
  try {
    const { rating, comment, user } = req.body;
    const product = await productModel.findById(req.params.id)

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() == user._id.toString()
      )

      if (alreadyReviewed) {
        return 'Product already reviewed'
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

      return newProduct.reviews.shift();

    } else {
      return 'Product not found';
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message)

  }
});



router.post("/delete-review/:id", async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id)
    if (product) {
      const index = product.reviews.findIndex(review => review._id == req.body.review_id);
      if (index !== -1) {
        product.reviews.splice(index, 1)
        await product.save()
        return { message: 'Review deleted' };
      }

      else return "Product not found";

    }

    else {
      return "Product not found";
    }

  } catch (error) {
    console.log(error);
    res.status(500).send("Server is don't working")

  }
})



}



module.exports = productRoutes;


