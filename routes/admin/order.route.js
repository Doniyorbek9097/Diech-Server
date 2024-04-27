const orderModel = require("../../models/order.model");
const otpModel = require("../../models/otp.model");
const router = require("express").Router();
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");

router.post('/order', async (req, res) => {
    try {
        const newOrder = new orderModel(req.body);

        const { phone_number } = newOrder;
        const otpCode = generateOTP(4);
        const otp = new otpModel({ phone_number: phone_number, otp: otpCode });

        const salt = await bcrypt.genSalt(10);
        otp.otp = await bcrypt.hash(otp.otp, salt);
        const otpResult = await otp.save();

        const txt = `${otpCode} - Tasdiqlash kodi.\nKodni hech kimga bermang.\nFiribgarlardan saqlaning.\nKompaniya OLCHA.UZ`
        sendSms(phone_number, txt)
        .then((response) => {
            console.log("result "+ response);
            return res.status(200).json("Success");
        })
        .catch((error) => {
            console.log("error "+ error)
        });


    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
});


router.get('/order-all', async(req, res) => {
    try {
        const orders = await orderModel.find().populate("products.product")
        res.json({
            message:" success",
            data: orders
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})



router.get("/order/:id", async (req, res) => {
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
        
        order = await order.save()
        res.json({
            data: order,
            message: "success"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
})


router.put("/order-update/:id", async (req, res) => {
    try {
        const updated = await orderModel.findByIdAndUpdate(req.params.id, req.body);
        res.json({
            data: updated,
            message: `success updated`
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json(error.message)
    }
})


router.delete("/order-delete/:id", async (req, res) => {
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