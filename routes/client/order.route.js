const orderModel = require("../../models/order.model");
const cartModel = require("../../models/cart.model")
const otpModel = require("../../models/otp.model");
const router = require("express").Router();
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");
const bot = require("../../bot");
const userModel = require("../../models/user.model")
const { Markup } = require("telegraf")

router.post('/order-add', async (req, res) => {
    try {
        const { customerInfo, products, user, address, status, location, delivery, totalAmount, cart_id } = req.body;
        const newOrder = await new orderModel(req.body).save();
        await cartModel.findByIdAndDelete(cart_id);
        const deliverer = await userModel.find({role:"deliverer"});
        deliverer.forEach(user => {
        let text = `<i>${customerInfo.username} <b>${products.length}</b> ta mahsulotga buyurtma berdi!</i>`
        bot.telegram.sendMessage(user?.telegram?.id, text, { parse_mode: "HTML" })

        });

        return res.json({
            data: newOrder,
            message: "success"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
});


router.get("/product-statistic", async (req, res) => {
    try {
        const sort = req.query.sort || "";
        const orders = await orderModel.find()
            .populate("products.product")
            .select("products -_id")
            .sort({ createdAt: -1 })

        res.json({
            data: orders.flatMap(order => order.products.filter(item => item.status == sort)),
            message: "success"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message)
    }
})


module.exports = router;