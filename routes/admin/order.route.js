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

        const updateProduct = async (product, orderId, item, increment) => {
            const index = product[increment.array].indexOf(orderId);
            if (index !== -1) product[increment.array].splice(index, 1);
            if (!product[increment.opposite].includes(orderId)) {
                product[increment.opposite].push(orderId);
                product.quantity += increment.change * item.quantity;
            }
            await product.save();
        };

        for (const order of orders) {
            for (const item of order.products) {
                const product = await productModel.findById(item.product?._id);
                if (!product) continue;

                const incrementMap = {
                    soldOut: { array: 'returned', opposite: 'soldOut', change: -1 },
                    returned: { array: 'soldOut', opposite: 'returned', change: 1 },
                    notSold: { array: 'soldOut', opposite: 'soldOut', change: 1 },
                };

                if (incrementMap[item.status]) {
                    await updateProduct(product, order._id, item, incrementMap[item.status]);
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