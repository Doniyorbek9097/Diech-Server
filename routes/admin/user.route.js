const tokenModel = require("../../models/token.model");
const otpModel = require("../../models/otp.model");
const userModel = require("../../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcrypt")
const router = require("express").Router();
const sendEmail = require("../../utils/sendEmail");
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const { generateToken } = require("../../utils/generateToken")
const { checkToken } = require("../../middlewares/authMiddleware")


router.get("/user/:id", checkToken, async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id)
            .populate({
                path: "shop",
                populate: {
                    path: 'products',
                }
            })

        !user ? res.status(500).send({
            message: "Token xato"
        })
        :
        res.json({
            message: "success",
            data: user
        })
       

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik " + error.message)
    }
});


router.get("/users", checkToken, async (req, res) => {
    try {
        const users = await userModel.find().populate("shop")
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json(`Serverda xatosi: ${error.message}`)
    }
});


router.post("/user-add", checkToken, async (req,res) => {
    try {
        
        let user = await userModel.findOne({username: req.body?.username});
        if(user) return res.json({message: "bunday username mavjud boshqa username kiriting"});

        user = await userModel.findOne({phone_number: req.body?.phone_number});
        if(user) return res.json({message: "bunday telefon raqam mavjud boshqa raqam kiriting"});

        let newUser = await new userModel(req.body);
        newUser.verified = true;
        const saltPassword = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, saltPassword)
        newUser.token = await generateToken({
            _id:newUser._id,
            phone_number: newUser.phone_number,
            role: newUser.role
        })
        newUser = newUser.save()
        return res.json({
            message:"success created",
            data: newUser
        })
    } catch (error) {
        console.log(error)
        res.status(500).json("Serverda Xatolik")
    }
})


router.put("/user-update/:id",  async (req, res) => {
    try {
        let user = await userModel.findOne({username: req.body?.username});
        if(user) return res.json({message: "bunday username mavjud boshqa username kiriting"});

        user = await userModel.findOne({phone_number: req.body?.phone_number});
        if(user) return res.json({message: "bunday telefon raqam mavjud boshqa raqam kiriting"});
console.log(req.body)

        const updated = await userModel.findByIdAndUpdate(req.params.id, req.body);
        res.send({
            message: "success updated",
            data: updated
        })
    } catch (error) {
        console.log(error);
        res.status(500).send("Serverda Xatolik")
    }
});



router.delete("/user-delete/:id", checkToken, async (req, res) => {
    try {
        const deleted = await userModel.findByIdAndDelete(req.params.id);
        res.status(200).json(deleted);
    } catch (error) {
        console.log(error);
        res.status(500).json(`Server xatosi: ${error.message}`)
    }
})



module.exports = router;



