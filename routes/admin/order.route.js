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
        const orders = await orderModel.find().populate("products.product")
        res.json({
            message: " success",
            data: orders
        })
        
        orders.forEach(order => {
            order.products.forEach(async (item) => {
                const product = await productModel.findById(item.product?._id);
                
                if (!product) return;

                switch (item.status) {
                    case "soldOut":
                        if (product.returned.orders.includes(order._id)) {
                            const index = product?.returned.orders.indexOf(order._id);
                            product.returned.orders.splice(index, 1);
                            product.returned.count -= item.quantity;

                        }
                        if (!product.soldOut.orders.includes(order._id)) {
                            product.soldOut.orders.push(order._id)
                            product.soldOut.count += item.quantity;
                            product.countInStock -= item.quantity;
                        }
                        break;

                    case "returned":
                        if (product.soldOut.orders.includes(order._id)) {
                            const index = product?.soldOut.orders.indexOf(order._id);
                            product.soldOut.orders.splice(index, 1);
                            product.soldOut.count -= item.quantity;
                            product.countInStock += item.quantity;
                        }

                        if (!product.returned.orders.includes(order._id)) {
                            product.returned.orders.push(order._id)
                            product.returned.count += item.quantity;
                        }
                        break;

                    case "notSold":
                        if (product.returned.orders.includes(order._id)) {
                            const index = product?.returned.orders.indexOf(order._id);
                            product.returned.orders.splice(index, 1);
                            product.returned.count -= item.quantity;

                        }
                        if (product.soldOut.orders.includes(order._id)) {
                            const index = product?.soldOut.orders.indexOf(order._id);
                            product.soldOut.orders.splice(index, 1);
                            product.soldOut.count -= item.quantity;
                            product.countInStock += item.quantity;
                        }


                }

                await product?.save()
            })
        })

       

    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})



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