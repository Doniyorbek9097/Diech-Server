const slugify = require("slugify");
const shopModel = require("../../models/shop.model");
const { generateToken } = require("../../utils/generateToken");
const { checkToken } = require("../../middlewares/authMiddleware")
const fileService = require("../../services/file.service")

const shopRoutes = async (fastify, options) => {
  try {
    
// POST /shop
fastify.post('/shop', { preHandler: checkToken }, async (req, reply) => {
    const shopData = req.body;
    try {
      shopData.slug = slugify(shopData.name);
  
      const shop = await shopModel.findOne({ slug: shopData.slug });
      if (shop) {
        return reply.send({
          message: "Bu Do'kon yaratilgan",
          errShop: true
        });
      }
  
      if (shopData.image) {
        shopData.image = await fileService.upload(shopData.image);
      }
      if (shopData.bannerImage) {
        shopData.bannerImage = await fileService.upload(shopData.bannerImage);
      }
  
      const result = await new shopModel(shopData).save();
      reply.send({
        message: "Muoffaqiyatli yaratildi",
        data: result
      });
    } catch (error) {
      if (shopData.image) {
        await fileService.remove(req.raw, shopData.image);
      }
      if (shopData.bannerImage) {
        await fileService.remove(req.raw, shopData.bannerImage);
      }
      console.log(error);
      return reply.status(500).send("Serverda Xatolik");
    }
  });
  
  // GET /shops
  fastify.get('/shops', { preHandler: checkToken }, async (req, reply) => {
    try {
      const shops = await shopModel.find()
        .populate('employees')
        .populate('products')
        .populate('point');
        return  reply.send(shops);
    } catch (error) {
      console.log(error);
      return  reply.status(500).send("Serverda Xatolik");
    }
  });
  
  // GET /shop/:id
  fastify.get('/shop/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
      const result = await shopModel.findById(req.params.id)
        .populate('employees')
        .populate('products')
        .populate('products');
        return reply.send(result);
    } catch (error) {
      console.log(error);
      return reply.status(500).send("Serverda Xatolik");
    }
  });
  
  // PUT /shop-update/:id
  fastify.put('/shop-update/:id', { preHandler: checkToken }, async (req, reply) => {
    const shopData = req.body;
  
    try {
      shopData.slug = slugify(req.body.name);
      if (shopData.image) {
        shopData.image = await fileService.upload(shopData.image);
      }
      if (shopData.bannerImage) {
        shopData.bannerImage = await fileService.upload(shopData.bannerImage);
      }
  
      const result = await shopModel.findByIdAndUpdate(req.params.id, shopData, { new: true });
      return reply.send({
        data: result,
        message: "success updated!"
      });
      if (shopData.deletedImages?.length) {
        await fileService.remove(shopData.deletedImages);
      }
    } catch (error) {
      if (shopData.image) {
        await fileService.remove(req.raw, shopData.image);
      }
      if (shopData.bannerImage) {
        await fileService.remove(req.raw, shopData.bannerImage);
      }
      console.log(error);
      return reply.status(500).send(error.message);
    }
  });
  
  // DELETE /shop-delete/:id
  fastify.delete('/shop-delete/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
      const data = await shopModel.findByIdAndDelete(req.params.id);
      return reply.send({ data, message: "success deleted!" });
    } catch (error) {
      console.log(error);
      return  reply.status(500).send("Serverda xatolik");
    }
  });
  } catch (error) {
    console.log(error);
  }
}



module.exports = shopRoutes;