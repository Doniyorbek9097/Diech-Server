const slugify = require("slugify");
const shopModel = require("../../models/shop.model");
const fileModel = require("../../models/file.model")

const shopRoutes = async (router, options) => {

    router.post("/shop", async (req, res) => {
        const shop = req.body;
        try {
            shop.slug = slugify(shop.slug);
            const newShop = await new shopModel(shop).save();
            const { image, bannerImage } = newShop;
            if (image) {
                await fileModel.updateOne(
                    { image_url: image },
                    { isActive: true, owner_id: newProduct._id, owner_type: "shop" },
                    { session }
                );
            }

            if (bannerImage) {
                await fileModel.updateOne(
                    { image_url: bannerImage },
                    { isActive: true, owner_id: newProduct._id, owner_type: "shop" },
                    { session }
                );
            }

            return res.send(newShop);
        } catch (error) {
            console.log(error)
            return res.code(500).send(error.message)
        }
    });


    router.get("/shops", async (req, res) => {
        try {
            const shops = await shopModel.find()
                .populate("employees")
                .populate("products")
                .populate("point")

            return {
                data: shops,
                message: "success"
            }

        } catch (error) {
            console.log(error)
            res.status(500).send(error.message)
        }
    });



    router.get("/shop/:slug", async (req, res) => {
        try {
            const result = await shopModel.findOne({ slug: req.params.slug })
                .populate(
                    {
                        path: "products",
                        populate: [
                            {
                                path: "product"
                            },
                            {
                                path: "shop"
                            }
                        ]
                    })

            return {
                data: result,
                message: "success"
            }

        } catch (error) {
            console.log(error);
            res.status(500).send(error.message)
        }
    });


    router.put("/shop/:id", async (req, res) => {
        const shop = req.body;
        try {
            shop.slug = slugify(shop.name);
            const newShop = await shopModel.findByIdAndUpdate(req.params.id, shop);
            const { image, bannerImage } = newShop;
            if (image) {
                await fileModel.updateOne(
                    { image_url: image },
                    { isActive: true, owner_id: newProduct._id, owner_type: "shop" },
                    { session }
                );
            }

            if (bannerImage) {
                await fileModel.updateOne(
                    { image_url: bannerImage },
                    { isActive: true, owner_id: newProduct._id, owner_type: "shop" },
                    { session }
                );
            }

            return res.send(newShop)
        } catch (error) {
            console.log(error)
            return res.code(500).send(error.message)
        }
    });


    router.delete("/shop/:id", async (req, res) => {
        try {
            const shop = await shopModel.findById(req.params.id);
            await fileService.remove(shop.image);
            await fileModel.findOneAndDelete({ image_url: shop.image });
            const deleted = await shopModel.findByIdAndDelete(shop._id);
            return res.send(deleted);
        } catch (error) {
            console.log(error)
            return res.code(500).send(error.message)
        }
    });

}


module.exports = shopRoutes;