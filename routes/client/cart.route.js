const cartModel = require("../../models/cart.model");
const router = require("express").Router();
const mongoose = require("mongoose")
const langReplace = require("../../utils/langReplace");
const { checkToken } = require('../../middlewares/authMiddleware');
const { isEqual } = require("../../utils/isEqual");

router.post("/add-cart", async (req, res) => {
    try {
        const { product: { quantity, attributes, _id: productId }, cart_id } = req.body;
        let cart = await cartModel.findOne({ "_id": cart_id });
        // Savatcha topilmasa, yangi savatcha yaratish
        if (!cart) {
            const data = await new cartModel(req.body).save();
            return res.status(201).json({ message: "success created", data });
        }

        // Savatchada mahsulotni qidirish va yangilash yoki yangi mahsulot qo'shish
        let foundProduct = cart.products.find(item =>
            item._id.toString() === productId && 
            (!attributes || isEqual(item.attributes, attributes))
        );

        if (foundProduct) {
            foundProduct.quantity = quantity;
        } else {
            cart.products.push(req.body.product);
        }

        const data = await cart.save();
        return res.json({ message: "success updated", data });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});


router.get("/cart/:id", async (req, res) => {
    try {
        let cart = await cartModel.findOne({ _id: req.params.id })
        .populate("products.shop")
        
        res.status(200).json(cart);
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