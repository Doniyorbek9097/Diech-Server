const tokenModel = require("../../models/token.model");
const { generateToken } = require("../../utils/generateToken");
const otpModel = require("../../models/otp.model");
const userModel = require("../../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcrypt")
const router = require("express").Router();
const sendEmail = require("../../utils/sendEmail");
const { checkToken } = require("../../middlewares/authMiddleware");
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");

router.post("/signup", async (req, res) => {
    try {
        let { phone_number } = req.body;
         if(!phone_number) return res.status(404).send("Telefon raqam topilmadi");

        const otpCode = generateOTP(4);
        const otp = new otpModel({ phone_number: phone_number, otp: otpCode });

        const salt = await bcrypt.genSalt(10);
        otp.otp = await bcrypt.hash(otp.otp, salt);

        const otpResult = await otp.save();

        const txt = `${otpCode} - Tasdiqlash kodi.\nKodni hech kimga bermang.\nFiribgarlardan saqlaning.\nKompaniya OLCHA.UZ`
        // const respon = await sendSms(phone_number, txt);
        console.log(otpCode);
        return res.status(200).json("OTP send successfully "+otpCode);

    } catch (error) {
        console.log(error);
        return res.status(500).json(`${error.message}`);

    }
});


router.post("/signup/verify", async (req, res) => {
    try {
        let { phone_number, otp } = req.body;
        const otpHoder = await otpModel.find({ phone_number: phone_number });
        
        if (otpHoder.length == 0) return res.status(400).json("You use an Expired OTP!");
        const lastOtpFind = otpHoder[otpHoder.length - 1];

        const validUser = await bcrypt.compare(otp, lastOtpFind.otp);

        if (lastOtpFind.phone_number === phone_number && validUser) {
            let user = await userModel.findOne({ phone_number: phone_number });
            if (!user) {
                user = new userModel({
                    otp,
                    phone_number,
                    username: `User-${phone_number.slice(-4)}`
                });
            }

            user.verified = true;

            const token = await generateToken({
                _id:user._id,
                phone_number: phone_number
            });
            const result = await user.save();

            const deleteOtp = await otpModel.deleteMany({ phone_number: lastOtpFind.phone_number });
            return res.status(200).json({
                message: "User Registration Successfully!",
                token: token,
                user: result
            })
        }


        return res.status(404).json("Verify code error")


    } catch (error) {
        console.log(error);
        return res.status(500).json(error.message)
    }
})


router.get("/user/:id", checkToken,  async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id);

        if (user) {
            return res.status(200).json(user);
        }

        return res.send("Token xato");


    } catch (error) {
        console.log(error);
        return res.status(500).json(error.message)
    }
});


router.get("/users", async (req, res) => {
    try {
        const users = await userModel.find();
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json(`Serverda xatosi: ${error.message}`)
    }
});


router.put("/user-update/:id", checkToken, async(req, res) => {
try {
    req.body.username = req.body.firstname || req.body.username;

    const updated = await userModel.updateOne({_id: req.params.id}, req.body);
    res.send("success updated")
} catch (error) {
    console.log(error);
    res.status(500).send("Serverda Xatolik")
}
});



// router.post("/register", async (req, res) => {
//     try {

//         let user = await userModel.findOne({ email: req.body.email });
//         if (user) return res.status(400).json(`${req.body.email} allaqachon ro'yxatdan o'tgan!`);

//         user = await new userModel(req.body).save();

//         const token = await new tokenModel({
//             userId: user._id,
//             token: crypto.randomBytes(32).toString("hex"),
//         }).save();
//         let message = {
//             email: user.email,
//             subject: "Ro'yxatdan o'tish uchun pastdagi Tasdiqlash havolasini usitiga bosing 👇",
//             html: `<a href="${process.env.BASE_URL}/users/${user._id}/verify/${token.token}">Tasdiqlash</a>`
//         }

//         const successjsonEmail = await sendEmail(message);
//         if (!successjsonEmail) {
//             await userModel.findByIdAndDelete(user._id);
//             await tokenModel.findByIdAndDelete(token._id);
//             return res.status(400).json("Elektron pochtangizga tasdiqlash xabarini yuborib bo'lmadi Elektron pochtangizni tekshiring!")
//         }

//         return res.status(200).json({ message: "Biz sizning pochtangizga tasdiqlovchi havola yubordik iltimos tasdiqlang !" })

//     } catch (error) {
//         return res.status(500).json(error.message);
//     }
// });


// router.get("/users/:id/verify/:token", async (req, res) => {
//     try {
//         const user = await userModel.findOne({ _id: req.params.id });
//         if (!user) return res.status(400).json("user_id Yaroqsiz");
//         const token = await tokenModel.findOne({ token: req.params.token });
//         if (!token) return res.status(400).json("Token Yaroqsiz!");
//         await userModel.updateOne({ _id: user._id, verified: true });
//         const delToken = await tokenModel.findByIdAndDelete(token._id);

//         if (delToken) return res.json({ message: "Elektron pochta muvaffaqiyatli tasdiqlandi" });

//     } catch (error) {
//         return res.status(500).json(error.message);
//     }
// });



// router.post("/auth", async (req, res) => {
//     try {
//         const user = await userModel.findOne({ email: req.body.email });
//         if (!user) return res.status(404).json("Yaroqsiz elektron pochta");
//         const validPassword = await user.comparePassword(req.body.password);
//         if (!validPassword) return res.status(404).json("Yaroqsiz Parol");
//         if (!user.verified) {
//             let token = await tokenModel.findOne({ userId: user._id });
//             if (!token) {
//                 token = await new tokenModel({
//                     userId: user._id,
//                     token: crypto.randomBytes(32).toString('hex')
//                 }).save();

//                 let message = {
//                     email: user.email,
//                     subject: "Ro'yxatdan o'tish uchun pastdagi Tasdiqlash havolasini usitiga bosing 👇",
//                     html: `<a href="${process.env.BASE_URL}/users/${user._id}/verify/${token.token}">Tasdiqlash</a>`
//                 }

//                 const successjsonEmail = await jsonEmail(message);
//                 console.log("salom")
//                 if (!successjsonEmail) return res.status(400).json("Elektron pochtangizga tasdiqlash xabarini yuborib bo'lmadi Elektron pochtangizni tekshiring!");
//             }

//             return res.status(200).json({ message: "Biz sizning pochtangizga tasdiqlovchi havola yubordik iltimos tasdiqlang !" })

//         }

//         const token = await user.generateToken();
//         res.json({
//             user: {
//                 _id: user._id,
//                 firstname: user.firstname,
//                 lastname: user.lastname,
//                 email: user.email,
//                 token,
//             },

//             message: "logged in successfully"
//         });
//     } catch (error) {
//         return res.status(500).json(error.message);
//     }
// });



// router.post("/reset-password", async (req, res) => {
//     try {
//         let user = await userModel.findOne({ email: req.body.email });
//         if (!user) return res.status(404).json("Bergan elektron pochta manzili mavjud emas!");
//         let token = await tokenModel.findOne({ userId: user._id })
//         console.log(token)
//         if (!token) {
//             token = await tokenModel({
//                 userId: user._id,
//                 token: crypto.randomBytes(32).toString('hex')
//             }).save();
//         }

//         let message = {
//             email: user.email,
//             subject: "Ro'yxatdan o'tish uchun pastdagi Tasdiqlash havolasini usitiga bosing 👇",
//             html: `${process.env.BASE_URL}/reset-password/${user._id}/${token.token}`
//         }

//         const successjsonEmail = sendEmail(message);
//         if (!successjsonEmail) return res.status(400).json("Elektron pochtangizga tasdiqlash xabarini yuborib bo'lmadi Elektron pochtangizni tekshiring!");
//         return res.json({ message: "Parolni tiklash havolasi elektron pochta hisobingizga yuborildi" })
//     } catch (error) {
//         return res.status(500).json(error.message);
//     }
// });


// router.get("/reset-password/:id/:token", async (req, res) => {
//     try {
//         const user = await userModel.findById(req.params.id);
//         if (!user) return res.status(404).json({ message: "Havoladagi userId haqiqiy emas!" });
//         const token = await tokenModel.findOne({ userId: user._id, token: req.params.token });
//         if (!token) return res.status(404).json({ message: "Havoladagi token haqiqiy emas!" });
//         res.status(200).json({ message: "Muoffaqqiyatli parol o'zgartish imkoniyati " })
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json(error.message);
//     }
// });



// //  set new password
// router.post("/reset-password/:id/:token", async (req, res) => {
//     try {

//         const user = await userModel.findOne({ _id: req.params.id });
//         if (!user) return res.status(404).json({ message: "Yaroqsiz user id" });

//         const token = await tokenModel.findOne({
//             userId: user._id,
//             token: req.params.token,
//         });
//         if (!token) return res.status(404).json({ message: "Yaroqsiz token" });

//         if (!user.verified) user.verified = true;
//         user.password = req.body.password;
//         await user.save();
//         await token.deleteOne();
//         return res.status(200).json({ message: "Parol muvaffaqiyatli tiklandi", user });
//     } catch (error) {
//         return res.status(500).json(error.message);
//     }
// });




// router.post("/reset-password/:id/:token", async (req, res) => {
//     try {
//         const user = await userModel.findOne({ _id: req.params.id });
//         if (!user) return res.status(404).json({ message: "user id noto'g'ri" });
//         let token = await tokenModel.findOne({ userId: user._id, token: req.params.token });
//         if (!token) return res.status(404).json("token xato");
//         if (!user.verified) user.verified = true;
//         const hashPassword = user.comparePassword(req.body.password);
//         user.password = hashPassword;
//         await token.remove();
//         await user.save();
//         res.status(200).json({ message: "Parol muvaffaqiyatli tiklandi" });

//     } catch (error) {
//         res.status(500).json(error.message);
//     }
// });

// router.get("/user/:id", async (req, res) => {
//     try {
//         const user = await userModel.findById(req.params.id)
//             .populate({
//                 path: "shops",
//                 populate: {
//                     path: "products"
//                 }
//             })

//         res.json(user)
//     } catch (error) {

//     }
// });


// router.put("/user/:id", async (req, res) => {
//     try {
//         console.log(req.body)
//         const result = await userModel.findByIdAndUpdate(req.params.id, req.body);
//         return res.status(200).json({ message: "Muoffaqqiyatli yangilanish", result })
//     } catch (error) {
//         return res.status(500).json(error.message);
//     }
// });

module.exports = router;



