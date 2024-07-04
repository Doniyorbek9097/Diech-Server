const cartModel = require("../../models/cart.model");
const router = require("express").Router();
const mongoose = require("mongoose")
const langReplace = require("../../utils/langReplace");
const { checkToken } = require('../../middlewares/authMiddleware');
const { isEqual } = require("../../utils/isEqual");
const { populate } = require("../../models/user.model");

router.post("/add-cart", async (req, res) => {
    try {
        const { product: { quantity, variant_id, product_id }, cart_id } = req.body;

        let cart = await cartModel.findOne({ "_id": cart_id })
        // Savatcha topilmasa, yangi savatcha yaratish
        if (!cart) {
            cart = new cartModel(req.body);
            cart.products.push(req.body.product)
            const data = await cart.save()
            return res.status(201).json({ message: "success created", data });
        }


        // Savatchada mahsulotni qidirish va yangilash yoki yangi mahsulot qo'shish
        let foundProduct = cart.products.find(item => {
            if(item) {
                return  item?.product_id?.toString() === product_id && variant_id && item?.variant_id?.toString() === variant_id
            }
        });

        if (foundProduct) {
            foundProduct.quantity = quantity;
        } else {
            cart.products.push(req.body.product);
        }



        let newCart = await cart.save();
        newCart = await cartModel.findById(newCart._id)
            .populate({
                path: 'products.product_id',
                populate: [
                    {
                        path: "product",
                        select: ["name", "images"]
                    },
                    {
                        path: "shop",
                        select: "name"
                    },
                    {
                        path: "brend",
                        select: "name"
                    },

                    {
                        path: 'variants.attributes.option',
                    },

                    {
                        path: 'variants.attributes.value',
                    }

                ]
            })

        const products = newCart.products.flatMap(item => {
            const variant = item.product_id?.variants.find(variant => variant?._id?.toString() == item?.variant_id?.toString())
            let product = variant || item.product_id;
            return {
                product: {
                    ...product.toJSON(),
                    name: item.product_id.product.name,
                    images: product?.images?.length ? product.images : product?.product?.images,
                    product_id: item.product_id._id,
                    variant_id: item.variant_id

                },

                quantity: item.quantity,
            }
        })

        const data = {
            ...newCart.toJSON(),
            products
        }


        return res.json({ message: "success updated", data });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});


router.get("/cart/:id", async (req, res) => {
    try {
        let cart = await cartModel.findOne({ _id: req.params.id })
            .populate({
                path: 'products.product_id',
                populate: [
                    {
                        path: "product",
                        select: ["name", "images"]
                    },
                    {
                        path: "shop",
                        select: "name"
                    },
                    {
                        path: "brend",
                        select: "name"
                    },

                    {
                        path: 'variants.attributes.option',
                    },

                    {
                        path: 'variants.attributes.value',
                    }

                ]
            })


        const products = cart?.products?.flatMap(item => {
            const variant = item.product_id?.variants.find(variant => variant?._id?.toString() == item?.variant_id?.toString())
            let product = variant || item.product_id;
            if (product) {
                return {
                    product: {
                        ...product?.toJSON(),
                        name: item.product_id.product.name,
                        images: product?.images?.length ? product.images : product?.product?.images,
                        product_id: item.product_id._id,
                        variant_id: item.variant_id

                    },

                    quantity: item.quantity,
                }
            }

        })

        const data = {
            ...cart?.toJSON(),
            products
        }

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(500).json(error.message);
    }
});




router.delete("/cart-delete/:id/:product_id", async (req, res) => {
    try {
        if (mongoose.isValidObjectId(req.params.id)) {
            const cart = await cartModel.findById(req.params.id);
            const productIndex = cart.products.findIndex(item => item._id === req.params.product_id);
            cart.products.splice(productIndex, 1);
            const SavedCart = await cart.save();
            return res.status(200).json(SavedCart)
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json(error.message)
    }
});


router.post("/cart-clear/:id", async (req, res) => {
    try {
        const cleared = await cartModel.deleteMany();
        return res.status(200).json(cleared);
    } catch (error) {
        console.log(error);
        res.status(500).send("Serverda Xatolik")
    }
})

module.exports = router;