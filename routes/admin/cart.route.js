const cartModel = require("../../models/cart.model");
const router = require("express").Router();
const mongoose = require("mongoose")
const langReplace = require("../../utils/langReplace");
const { checkToken } = require('../../middlewares/authMiddleware');

router.post("/add-cart", async (req, res) => {
    try {
        const { products: { product, quantity }, user: userId, cart_id: cartId } = req.body;

        let cart = await cartModel.findOne({ "_id": cartId });
        // cart not found 
        if (!cart) {
            const data = await cartModel(req.body).save();
            return res.status(201).json(data);
        }
        cart.user = userId;
        const cartProduct = cart.products.findIndex(item => item.product.toString() === product.toString());
        if (cartProduct === -1) {
            cart.products.push(req.body.products);
        } else {
            cart.products = cart.products.map(item => {
                if (item.product.toString() === product.toString()) {
                        item.quantity = quantity;
                    }

                return item;
            });
        }


        const data = await cart.save();
        return res.status(200).json(data);

    } catch (error) {
        console.log(error)
        return res.status(500).json(error.message);
    }
});

router.get("/cart/:id",  async (req, res) => {
    try {

        const lang = req.headers['lang'];
        let cart = await cartModel.findOne({_id:req.params.id})
            .populate("user")
            .populate("products.product");

        if (cart) {
            cart = JSON.parse(JSON.stringify(cart));

            cart.products = cart.products.map(item => {
                item.product = langReplace(item.product, lang);
                return item;
            });

           return res.status(200).json(cart);

        }

        return res.status(404).json("not found");
    } catch (error) {
        console.log(error)
        return res.status(500).json(error.message);
    }
});





router.delete("/cart-delete/:id/:product_id", async (req, res) => {
    try {
        if(mongoose.isValidObjectId(req.params.id)) {
            const cart = await cartModel.findById(req.params.id);
            const productIndex = cart.products.findIndex(item => item.product._id.toString() === req.params.product_id.toString());
            cart.products.splice(productIndex, 1);
            const SavedCart = await cart.save();
            return res.status(200).json(SavedCart)
        }
    } catch (error) {
        console.log(error)
       return res.status(500).json(error.message)
    }
});

module.exports = router;