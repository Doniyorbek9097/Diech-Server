const cartModel = require("../../models/cart.model");
const router = require("express").Router();
const mongoose = require("mongoose")
const langReplace = require("../../utils/langReplace");
const { checkToken } = require('../../middlewares/authMiddleware');

router.post("/add-cart", async (req, res) => {
    try {
        const { productData: { product, quantity }, cart_id } = req.body;
        let cart = await cartModel.findOne({ "_id": cart_id }).populate("productData.product")

        // cart not found 
        if (!cart) {
            const data = await cartModel(req.body).save();
            return res.status(201).json({
                message:"success created",
                data
            });
        }

        const foundProduct = cart.productData.find(item => item.product._id.toString() === product?._id);
        foundProduct ? (foundProduct.quantity = quantity) : cart.productData.push(req.body.productData);

        const data = await cart.save();
        return res.json({
            message: "success updated",
            data
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json(error.message);
    }
});

router.get("/cart/:id", async (req, res) => {
    try {
        let cart = await cartModel.findOne({ _id: req.params.id })
            .populate("productData.product")
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
            const productIndex = cart.productData.findIndex(item => item.product._id === req.params.product_id);
            cart.productData.splice(productIndex, 1);
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