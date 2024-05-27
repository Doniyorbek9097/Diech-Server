const orderModel = require("../../models/order.model");
const otpModel = require("../../models/otp.model");
const router = require("express").Router();
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");
const { productModel } = require("../../models/product.model")
const { checkToken } = require("../../middlewares/authMiddleware");


router.get('/order-all', checkToken, async (req, res) => {
    try {
        const orders = await orderModel.find().populate("products.product");
        res.json({ message: "success", data: orders });

        for (const order of orders) {
            for (const productData of order.products) {
                const product = await productModel.findById(productData.product?._id);

                if (product) {
                    let target = product;
                    if (product.variants && product.variants.length > 0) {
                        target = product.variants.find(variant => variant._id.toString() === productData.selected_variant._id.toString()) || product;
                    }

                    const statusActions = {
                        soldOut: () => {
                            if (!target.soldOut.some(item => item.toString() === order._id.toString())) {
                                const returnedIndex = target.returned.findIndex(item => item.toString() === order._id.toString());
                                if (returnedIndex !== -1 && target.returnedCount > 0) {
                                    target.returned.splice(returnedIndex, 1);
                                    target.returnedCount -= productData.quantity; 
                                }
                                target.soldOut.push(order._id);
                                target.soldOutCount += productData.quantity;
                                target.quantity = Math.max(target.quantity - productData.quantity, 1);
                            }
                        },
                        returned: () => {
                            if (!target.returned.some(item => item.toString() === order._id.toString())) {
                                const soldIndex = target.soldOut.findIndex(item => item.toString() === order._id.toString());
                                if (soldIndex !== -1 && target.soldOutCount > 0) {
                                    target.soldOut.splice(soldIndex, 1);
                                    target.soldOutCount -= productData.quantity;
                                }
                                target.returned.push(order._id);
                                target.returnedCount += productData.quantity; 
                                target.quantity = Math.max(target.quantity + productData.quantity, 1);
                            }
                        }
                    };

                    statusActions[productData.status]?.();
                    await product.save();
                }
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});





router.get("/order/:id", checkToken, async (req, res) => {
    try {
        let order = await orderModel.findById(req.params.id)
            .populate({
                path: "products.product",
                populate: {
                    path: "shop"
                }
            })

            .populate({
                path: "products.product",
                populate: {
                    path: "owner"
                }
            })

        res.json({
            data: order,
            message: "success"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})


router.put("/order-update/:id", checkToken, async (req, res) => {
    try {

        const updated = await orderModel.findByIdAndUpdate(req.params.id, req.body);
        res.json({
            data: updated,
            message: `success updated`
        });

    } catch (error) {
        console.log(error.message)
        res.status(500).json(error.message)
    }
})


router.delete("/order-delete/:id", checkToken, async (req, res) => {
    try {
        const deleted = await orderModel.findByIdAndDelete(req.params.id)
        res.json({
            data: deleted,
            message: "Success deleted"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})

module.exports = router;