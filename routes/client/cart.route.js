const cartModel = require("../../models/cart.model");
// const router = require("express").Router();
const mongoose = require("mongoose");
const { populate } = require("../../models/order.model");

const cartRoutes = async (router, options) => {
    router.post("/add-cart", async (req, res) => {
        try {
            const { product: { quantity, variant_id, product_id }, cart_id } = req.body;

            let cart = await cartModel.findOne({ "_id": cart_id })
            // Savatcha topilmasa, yangi savatcha yaratish
            if (!cart) {
                cart = new cartModel(req.body);
                cart.products.push(req.body.product)
                const data = await cart.save()
                return { message: "success created", data };
            }


            // Savatchada mahsulotni qidirish va yangilash yoki yangi mahsulot qo'shish
            let foundProduct = cart.products.find(item => {
                if (item) {
                    if (variant_id) {
                        return item?.variant_id?.toString() === variant_id;
                    } else {
                        return item?.product_id?.toString() === product_id;
                    }
                }
            });

            if (foundProduct) {
                foundProduct.quantity = quantity;
            } else {
                cart.products.push(req.body.product);
            }

            cart = await cart.save()

            cart = await cartModel.findOne({ _id: cart.id })
                .populate('products.product_id')
                .populate('products.variant_id')

            const products = cart?.products?.flatMap(item => ({
                variant: item?.variant_id,
                product: item?.product_id,
                quantity: item.quantity
            }))

            const data = {
                ...cart?.toJSON(),
                products
            }

            // res.status(200).json(data);

            return { message: "success added", data: data };

        } catch (error) {
            console.error(error);
            return res.status(500).send({ message: error.message });
        }
    });


    router.get("/cart/:id", async (req, res) => {
        try {
            let cart = await cartModel.findOne({ _id: req.params.id })
                .populate({
                    path: "products.product_id",
                    select: "name images orginal_price sale_price discount",
                    populate: {
                        path: "shop",
                        select: "name slug",
                    }
                })
                .populate("products.variant_id")
            
            const products = cart?.products?.flatMap(item => ({
                variant: item?.variant_id,
                product: item?.product_id,
                quantity: item.quantity
            }))

            const data = {
                ...cart?.toJSON(),
                products
            }

            return data;
        } catch (error) {
            console.log(error);
            return res.status(500).send(error.message);
        }
    });




    router.delete("/cart-delete/:id/:product_id", async (req, res) => {
        try {
            if (mongoose.isValidObjectId(req.params.id)) {
                const cart = await cartModel.findById(req.params.id);
                const productIndex = cart.products.findIndex(item => item._id === req.params.product_id);
                cart.products.splice(productIndex, 1);
                const SavedCart = await cart.save();
                return SavedCart
            }
        } catch (error) {
            console.log(error)
            return res.status(500).send(error.message)
        }
    });


    router.post("/cart-clear/:id", async (req, res) => {
        try {
            const cleared = await cartModel.deleteMany();
            return cleared;
        } catch (error) {
            console.log(error);
            res.status(500).send("Serverda Xatolik")
        }
    })

}



module.exports = cartRoutes;