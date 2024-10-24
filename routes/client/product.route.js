const productModel = require("../../models/product.model");
const shopProductModel = require("../../models/shop.product.model");
const { algolia } = require("../../config/algolia");
const { $exists } = require("sift");
const productsIndex = algolia.initIndex("ShopProducts");


async function productRoutes(fastify, options) {
  // get all products search
  fastify.get("/products-search", async (req, reply) => {
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


      const totalDocuments = await shopProductModel.countDocuments(query).exec()
      const totalPages = Math.ceil(totalDocuments / limit);

      const products = await shopProductModel.find(query)
        .populate('categories', 'name slug')
        .select('name slug images keywords category')

      const data = {
        message: "success get products",
        products,
        limit,
        page,
        totalPages
      };

      return reply.send(data);

    } catch (error) {
      console.error(error);
      reply.status(500).send({ message: error.message });
    }
  });


  // product all
  fastify.get("/products", async (req, reply) => {
    try {
      const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
      const limit = parseInt(req.query.limit, 10) || 8;

      const {
        search = "",
        category_id = "",
        viewsCount,
        disCount,
        random,
        price,
      } = req.query;


      const sort = { positon: 1 };
      if (Boolean(viewsCount)) sort.viewsCount = -1;
      if (price) sort.price = Number(price);
      if (Boolean(disCount)) sort.discount = -1;

      const query = {};
      if (Boolean(disCount)) query.discount = { $exists: true, $ne: 0 };
      let totalPage = 0;



      if (category_id) {
        function findMostFrequent(arr) {
          return arr.sort((a, b) =>
            arr.filter(v => v === a).length - arr.filter(v => v === b).length
          ).pop();
        }

        const foundCategoryId = findMostFrequent(category_id.split(","))
        query.categories = { $in: [category_id.split(",")] };
      }

      if (search) {
        const options = { page, hitsPerPage: limit };
        const { hits, nbPages } = await productsIndex.search(search, options);
        const ids = hits.map(item => item.objectID);
        query._id = { $in: ids };
        totalPage = nbPages;
      } else {
        const totalProducts = await shopProductModel.countDocuments(query);
        totalPage = Math.ceil(totalProducts / limit);
      }

      // Paginatsiyani to'g'ri ishlashini ta'minlash
      if (Boolean(random)) {
        const ids = await shopProductModel.getRandomProducts({ query, page, sort, limit });
        query._id = { $in: ids };
      }

      const result = await shopProductModel.find(query)
        .sort(sort)
        .skip(page * limit)  // Sahifaga bog'liq mahsulotlarni olish uchun skip ishlatilmoqda
        .limit(limit)        // Limit paginatsiya uchun ishlatilmoqda
        .select('name orginal_price sale_price inStock slug images rating reviewsCount discount');

      const data = {
        message: "success get products",
        products: result,
        limit,
        page: page + 1, // Sahifani foydalanuvchilar uchun 1 dan boshlaymiz
        totalPage,
      };

      return reply.send(data);

    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: error.message });
    }
  });


  // one product by slug
  fastify.get("/product-slug/:slug", async (req, reply) => {
    let variantQuery = [];
    req.query?.variant && (variantQuery = req.query?.variant?.split('-') || []);
    const { slug = '' } = req.params;
    const limit = parseInt(req.query.limit, 8) || 8;

    try {
      let user_id = req.headers['user'];
      user_id = (user_id === "null") ? null : (user_id === "undefined") ? undefined : user_id;

      let product = await shopProductModel.findOneAndUpdate(
        { slug },
        {
          $inc: { viewsCount: 1 },
          $addToSet: { views: user_id },
        },
        { new: true }
      )
        .populate("categories", "name slug")
        .populate("shop", "slug")
        .populate("variants")
        .populate({
          path: "reviews",
          options: {
            sort: { rating: -1 }, // Sharhlarni saralash
            limit: 8             // Limitni qo'llash
          }
        })
        .select("-keywords")

        

      if (!product) {
        return reply.status(404).send({ message: "Product not found" });
      }

      const firstCategory = product.categories[0];
      const lastCategory = product.categories[product.categories.length - 1];

      const getCategoryProducts = async (category) => {
        const [result] = await shopProductModel.aggregate([
          { $match: { categories: { $in: [category._id] } } },
          { $sample: { size: 8 } },
          { $project: { _id: 1 } },
          { $group: { _id: null, ids: { $push: '$_id' } } },
          { $project: { _id: 0, ids: 1 } }
        ]);

        const randomProductIds = result ? result.ids : [];
        return await shopProductModel.find({ _id: { $in: randomProductIds, },  slug: { $ne: slug } })
          .populate("categories", "slug")
          .select("categories name slug images inStock orginal_price sale_price discount reviewsCount viewsCount")
          .limit(8);
      };

      const firstCategoryProducts = await getCategoryProducts(firstCategory);
      const lastCategoryProducts = await getCategoryProducts(lastCategory);

      const data = {
        product,
        firstCategory: {
          category: firstCategory,
          products: firstCategoryProducts
        },
        lastCategory: {
          category: lastCategory,
          products: lastCategoryProducts
        },
      };

      return reply.send({ data, message: "success" });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: error.message });
    }
  });


  // addrewies 

  fastify.post("/add-review/:id", async (req, reply) => {
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
        product.rating = Math.min(Math.max(product.rating, 0), 5);

        const newProduct = await product.save();

        return newProduct.reviews.shift();

      } else {
        return 'Product not found';
      }
    } catch (error) {
      console.log(error);
      reply.status(500).send(error.message)

    }
  });


  fastify.post("/delete-review/:id", async (req, reply) => {
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
      reply.status(500).send("Server is don't working")

    }
  })


  fastify.get("/product-image-cache", async(req, reply) => {
     try {
        const products = await shopProductModel.find({}).select("images");
        const images = products.map(item => item.images[0]);
        return reply.send(images)
     } catch (error) {
        console.log(error)
     }
  })

}



module.exports = productRoutes;


