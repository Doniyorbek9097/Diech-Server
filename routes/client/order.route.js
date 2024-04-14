const orderModel = require("../../models/order.model");
const otpModel = require("../../models/otp.model");
const router = require("express").Router();
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");
// const bot = require("../../bot");


router.post('/order', async (req, res) => {
    try {
        const newOrder = new orderModel(req.body).save();

        const { username, phone_number, products } = req.body;
        const otpCode = generateOTP(4);
        const otp = new otpModel({ phone_number: phone_number, otp: otpCode });

        const salt = await bcrypt.genSalt(10);
        otp.otp = await bcrypt.hash(otp.otp, salt);
        const otpResult = await otp.save();

        // const txt = `${otpCode} - Tasdiqlash kodi.\nKodni hech kimga bermang.\nFiribgarlardan saqlaning.\nKompaniya OLCHA.UZ`
        // sendSms(phone_number, txt)
        // .then((response) => {
        //     console.log("result "+ response);
        // })
        // .catch((error) => {
        //     console.log("error "+ error)
        // });

        let text = `👤 <b>Buyurtmachi</b>: ${username}\n<b>☎️ Telefon raqami</b>: ${phone_number}\n<b>🛍️ Barcha Mahsulotlar 👇👇👇</b>\n`;

            for (const item of products) {
                text += `-----------------\n${item.product.name} - ${item.quantity} ta\n`
            }

            // bot.telegram.sendMessage("918510894", text, {
            //     parse_mode:"HTML"
            // });

            return res.status(200).json(newOrder);

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