const orderModel = require("../../models/order.model");
const cartModel = require("../../models/cart.model")
const otpModel = require("../../models/otp.model");
const router = require("express").Router();
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");
const bot = require("../../bot");


router.post('/order-add', async (req, res) => {
    try {
        const { customerInfo, products, user, address, location, delivery, totalAmount, cart_id } = req.body;
        const newOrder = await new orderModel(req.body).save();
        await cartModel.findByIdAndDelete(cart_id);
        let text = `👤 <b>Buyurtmachi</b>: ${customerInfo?.firstname}
        <b>Viloyat:</b>: ${address?.region}
        <b>Tuman:</b>: ${address?.distirct}
        <b>MFY:</b>: ${address?.mfy}
        <b>Ko'cha:</b>: ${address?.street}
        <b>Uy raqami:</b>: ${address?.house}
        <b>Uy qavvati:</b>: ${address?.house}
        <b>Telefon raqami</b>: ${customerInfo?.phone_number}

        <b>Yetkazib berish usuli:</b>: ${delivery?.method}
        <b>Yetkazib berish sanasi</b>: ${delivery?.time}
        <b>Kuyuer uchun izoh</b>: ${delivery?.comment}
        <b>Yetkazib berish narxi</b>: ${delivery?.price}
        <b>Jam mahsulotlar narxi</b>: ${totalAmount}
    
        <b>🛍️ Barcha Mahsulotlar 👇👇👇</b>
        `;

        for (const item of products) {
            text += `-----------------\n${item.product.name} - ${item.quantity} x ${item.sale_price} == ${item.sale_price * item.quantity} so'm\n`
        }

        bot.telegram.sendMessage("918510894", text, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Joylashuv manzili", callback_data: `${JSON.stringify(location)}` }],
                    [
                        { text: "Mahsulot tasdiqlandi", callback_data: `location` },
                        {text:"Mahsulot tayyorlanmoqda", callback_data:`location`},
                    ],
                    [
                        {text:"Mahsulot tayyorlanmoqda", callback_data:`location`},
                        {text:"Mahsulot yo'lga chiqdi", callback_data:`location`},
                    ],
                        {text:"Mahsulot yetkazildi", callback_data:`location`}
                    [
                        {text:"Mahsulot yetkazildi", callback_data:`location`}
                    ]
                ]
            }
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