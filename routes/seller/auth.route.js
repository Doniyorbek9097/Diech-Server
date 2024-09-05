const tokenModel = require("../../models/token.model");
const otpModel = require("../../models/otp.model");
const userModel = require("../../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcrypt")
const sendEmail = require("../../utils/sendEmail");
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const { generateToken } = require("../../utils/generateToken")
const { checkToken } = require("../../middlewares/authMiddleware")

const AuthRoutes = async(fastify, options) => {

    fastify.post('/signup', async (req, reply) => {
        try {
            const { phone_number } = req.body;
            let user = await userModel.findOne({ phone_number });
            if (user) {
                return reply.send({
                    message: `${phone_number} allaqachon ro'yxatdan o'tgan!`
                });
            }
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
            return reply.status(200).send({
                message: txt,
                data: otpCode
            });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send(`Serverda xatolik ${error.message}`);
        }
    });
    
    fastify.post('/signup/verify', async (req, reply) => {
        try {
            const { phone_number, otp } = req.body;
            const otpHolder = await otpModel.find({ phone_number: phone_number });
            if (otpHolder.length == 0) {
                return reply.send({
                    message: "Tasdiqlash kodi eskirgan!"
                });
            }
            const lastOtpFind = otpHolder[otpHolder.length - 1];
    
            const validUser = await bcrypt.compare(otp, lastOtpFind.otp);
    
            if (lastOtpFind.phone_number === phone_number && validUser) {
                let user = await userModel.findOne({ phone_number: phone_number })
                    .populate({
                        path: "shop",
                        populate: {
                            path: "products"
                        }
                    });
    
                if (!user) {
                    return reply.send({
                        message: "Foydalanuvchi topilmadi"
                    });
                }
                user.verified = true;
                user.role = "admin";
                const documentCount = await userModel.countDocuments();
                if (documentCount === 1) user.role = "creator";
    
                const token = await generateToken({
                    _id: user._id,
                    phone_number: phone_number
                });
    
                user = await user.save();
    
                await otpModel.deleteMany({ phone_number: lastOtpFind.phone_number });
                return reply.status(200).send({
                    message: "Muoffaqqiyatli ro'yxatdan o'tdingiz",
                    data: {
                        _id: user?._id,
                        firstname: user?.firstname,
                        username: user?.username,
                        lastname: user?.lastname,
                        email: user?.email,
                        phone_number: user?.phone_number
                    },
                    token: token
                });
            }
    
            return reply.send({
                message: "Tasdiqlash kodi xato"
            });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send(`Serverda Xatolik ${error.message}`);
        }
    });
    

    fastify.post('/signin', async (req, reply) => {
        try {
            const user = await userModel.findOne({ phone_number: req.body.phone_number })
                .populate({
                    path: "shop"
                });
    
            if (!user) {
                return reply.send({
                    message: "Telefon raqam yoki parol xato",
                });
            }
    
            if (!user.password) {
                return reply.send({ message: "Siz Seller sifatida ro'yxatdan o'tmagansiz!" });
            }
    
            const validPassword = await bcrypt.compare(req.body.password, user.password);
            if (!validPassword) {
                return reply.send({
                    message: "Telefon raqam yoki parol xato",
                });
            }
            if (user.role !== "seller") {
                return reply.send({
                    message: "Telefon raqam yoki parol xato"
                });
            }
            const token = await generateToken({
                _id: user._id,
                phone_number: user.phone_number,
                role: user.role,
            });
    
            return reply.send({
                data: {
                    _id: user._id,
                    firstname: user?.firstname,
                    lastname: user?.lastname,
                    email: user?.email,
                    username: user.username,
                    phone_number: user?.phone_number,
                    shop: user?.shop
                },
                token,
                message: "Muoffaqqiyatli ro'yxatdan o'tdingiz"
            });
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send(error.message);
        }
    });
    
    fastify.post('/reset-password', async (req, reply) => {
        try {
            let user = await userModel.findOne({ phone_number: req.body.phone_number });
            if (!user) {
                return reply.status(404).send("Bergan Telefon raqam mavjud emas!");
            }
    
            const otpCode = generateOTP(4);
            const otp = new otpModel({
                phone_number: user.phone_number,
                otp: otpCode
            });
    
            const saltOtp = await bcrypt.genSalt(10);
            otp.otp = await bcrypt.hash(otp.otp, saltOtp);
            await otp.save();
    
            const txt = `${otpCode} - Tasdiqlash kodi.\nKodni hech kimga bermang.\nFiribgarlardan saqlaning.\nKompaniya OLCHA.UZ`
            // const respon = await sendSms(phone_number, txt);
            return reply.status(200).send(otpCode);
            // return reply.send({ message: "Parolni tiklash Codeni telefon raqamingizga yuborildi" });
        } catch (error) {
            return reply.status(500).send(error.message);
        }
    });
    
    fastify.post('/update-password', async (req, reply) => {
        try {
            const { id, token } = req.params;
            const user = await userModel.findOne({ _id: id });
            if (!user) {
                return reply.status(404).send({ message: "Yaroqsiz user id" });
            }
    
            const tokenRecord = await tokenModel.findOne({
                userId: user._id,
                token: token,
            });
            if (!tokenRecord) {
                return reply.status(404).send({ message: "Yaroqsiz token" });
            }
    
            if (!user.verified) user.verified = true;
            user.password = req.body.password;
            await user.save();
            await tokenRecord.deleteOne();
            return reply.status(200).send({ message: "Parol muvaffaqiyatli tiklandi", user });
        } catch (error) {
            return reply.status(500).send(error.message);
        }
    });
    
}


module.exports = AuthRoutes;