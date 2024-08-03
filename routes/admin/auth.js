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
const Auth = require("../../controllers/admin/auth");
const { default: slugify } = require("slugify");

router.get("/auth/:id", Auth.user);

router.get("/users-update", async (req, res) => {
    const users = await userModel.find();

    // Har bir foydalanuvchini yangilang
    for (const user of users) {
      await userModel.updateOne(
        { _id: user._id }, // Foydalanuvchini aniqlash uchun filtr
        { $set: { username: user.phone_number.split(" ").join("").slice(-4) } } // Yangilanish
      );
    }

    res.send("updated users")
})


router.post("/signup", async (req, res) => {
    try {
         const { phone_number, email} = req.body;
         
        let user = await userModel.findOne({ phone_number });
        if (user) return res.json({
            message: `${phone_number} allaqachon ro'yxatdan o'tgan!`,
        });

        user = await userModel.findOne({ email });
        if (user) return res.json({
            message: `${email} allaqachon ro'yxatdan o'tgan!`,
        });

    
        const saltPassword = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, saltPassword);
        user = await new userModel(req.body).save();

        const otpCode = generateOTP(4);
        const otp = new otpModel({ phone_number, otp: otpCode });
        const saltOtp = await bcrypt.genSalt(10);
        otp.otp = await bcrypt.hash(otp.otp, saltOtp);
        await otp.save();

        const txt = `${otpCode} - Tasdiqlash kodi.\nKodni hech kimga bermang.\nFiribgarlardan saqlaning.\nKompaniya OLMA.UZ`
        // const respon = await sendSms(phone_number, txt);
        return res.json({
            message:"Tasdiqlash kodi yubdik "+ otpCode,
            data: otpCode
        });

    } catch (error) {
        console.log(error)
        res.status(500).json(`Serverda xatolik ${error.message}`);
    }
});


router.post("/signup/verify", async (req, res) => {
    try {
        const { phone_number, code } = req.body;
        console.log(req.body)
        const otpHoder = await otpModel.find({ phone_number: phone_number });
        if (otpHoder.length == 0) return res.json({
            message: "Tasdiqlash kodi xato yoki muddati tugagan!",
        });
        const lastOtpFind = otpHoder[otpHoder.length - 1];

        const validUser = await bcrypt.compare(code, lastOtpFind.otp);

        if(!validUser) return res.json({
            message:"Tasdiqlash kodi xato yoki muddati tugagan!",
        })

        if (lastOtpFind.phone_number === phone_number && validUser) {
            let user = await userModel.findOne({ phone_number: phone_number });
            if (!user) return res.json({
                message: "Bunday foydalanuvchi topilmadi"
            })

            user.verified = true;
            user.role = "admin";
            user.username = slugify(`${user.firstname}-${generateOTP(4)}`);
            

            // const documetCoout = await userModel.countDocuments();
            // if(documetCoout == 1) user.role = "creator";
            
            const token = await generateToken({
                _id: user._id,
                phone_number: phone_number
            });

            user = await user.save();

            const deleteOtp = await otpModel.deleteMany({ phone_number: lastOtpFind.phone_number });
            return res.status(200).json({
                message: "Muvaffaqiyatli roʻyxatdan oʻtdingiz!",
                data: {
                    _id: user?._id,
                    firstname: user?.firstname,
                    username: user?.username,
                    lastname: user?.lastname,
                    email: user?.email,
                    phone_number: user?.phone_number
                },
                token: token
            })
        }

        return res.json({
            message: "Tasdiqlash kodi xato",
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json("Serverda Xatolik " + error.message)
    }
})



router.post("/signin", async (req, res) => {
    try {
        const user = await userModel.findOne({ phone_number: req.body.phone_number });
        if (!user) {
            return res.json({
                message: "Telefon raqam xato topilmadi",
            });
        } 
        const validPassword = await bcrypt.compare(req.body.password, user.password);

        if (!validPassword) {
            return res.json({
                message:"Parolingiz xato",
            })
        }

        if (user.role !== "admin") {
            return res.json({
                message: "Siz admin emassiz",
            });
        }  
        const token = await generateToken({
            _id: user._id,
            phone_number: user.phone_number,
            role: user.role,
        });

        res.status(200).json({
            message: "Muofaqqiyatli kirish",
            token,
            data:{
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                userame: user.username,
                email: user.email,
                phone_number: user.phone_number
            },
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json("Server Xatosi "+ error.message);
    }
});



router.post("/reset-password", async (req, res) => {
    try {
        let user = await userModel.findOne({ phone_number: req.body.phone_number });
        if (!user) return res.status(404).json("Bergan Telefon raqam mavjud emas!");

        const otpCode = generateOTP(4);
        otp = new otpModel({
            phone_number: user.phone_number,
            otp: otpCode
        });

        const saltOtp = await bcrypt.genSalt(10);
        otp.otp = await bcrypt.hash(otp.otp, saltOtp);
        const otpResult = await otp.save();


        const txt = `${otpCode} - Tasdiqlash kodi.\nKodni hech kimga bermang.\nFiribgarlardan saqlaning.\nKompaniya OLCHA.UZ`
        // const respon = await sendSms(phone_number, txt);
        res.status(200).json(otpCode);
        // return res.json({ message: "Parolni tiklash Codeni telefon raqamingizga yuborildi" })

    } catch (error) {
        return res.status(500).json(error.message);
    }
});


//  set new password
router.post("/update-password", async (req, res) => {
    try {

        const user = await userModel.findOne({ _id: req.params.id });
        if (!user) return res.status(404).json({ message: "Yaroqsiz user id" });

        const token = await tokenModel.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!token) return res.status(404).json({ message: "Yaroqsiz token" });

        if (!user.verified) user.verified = true;
        user.password = req.body.password;
        await user.save();
        await token.deleteOne();
        return res.status(200).json({ message: "Parol muvaffaqiyatli tiklandi", user });
    } catch (error) {
        return res.status(500).json(error.message);
    }
});


module.exports = router;