const orderModel = require("../../models/order.model");
const cartModel = require("../../models/cart.model")
const otpModel = require("../../models/otp.model");
const router = require("express").Router();
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");
// const bot = require("../../bot");


router.post('/order-add', async (req, res) => {
    try {
        const { customerInfo, products, cart_id } = req.body;
        const newOrder = await new orderModel(req.body).save();
        await cartModel.findByIdAndDelete(cart_id);
        let text = `👤 <b>Buyurtmachi</b>: ${customerInfo?.firstname}\n<b>☎️ Telefon raqami</b>: ${customerInfo?.phone_number}\n<b>🛍️ Barcha Mahsulotlar 👇👇👇</b>\n`;

            for (const item of products) {
                text += `-----------------\n${item.product.name} - ${item.quantity} ta\n`
            }

            // bot.telegram.sendMessage("918510894", text, {
            //     parse_mode:"HTML"
            // });

            return res.json({
                data: newOrder,
                message: "success"
            });
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
});


router.get("/orders", async (req, res) => {
    try {
        const orders = await orderModel.find().populate("products.product")
        res.status(200).json(orders)
    } catch (error) {
        console.log(error);
    }
})


module.exports = router;