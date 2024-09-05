const tokenModel = require("../../models/token.model");
const otpModel = require("../../models/otp.model");
const userModel = require("../../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcrypt")
const sendEmail = require("../../utils/sendEmail");
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const { generateToken } = require("../../utils/generateToken")
const auth = require("../../controllers/admin/auth.controller");
const slugify = require("slugify");


const AuthRoutes = async (fastify, options) => {

    fastify.get("/auth/:id", auth.user);

    fastify.post('/signup', async (req, reply) => {
        try {
            const { phone_number, email } = req.body;

            let user = await userModel.findOne({ phone_number });
            if (user) return reply.send({
                message: `${phone_number} allaqachon ro'yxatdan o'tgan!`,
            });

            user = await userModel.findOne({ email });
            if (user) return reply.send({
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

            const txt = `${otpCode} - Tasdiqlash kodi.\nKodni hech kimga bermang.\nFiribgarlardan saqlaning.\nKompaniya OLMA.UZ`;
            // const response = await sendSms(phone_number, txt);

            return reply.send({
                message: "Tasdiqlash kodi yuborildi " + otpCode,
                data: otpCode
            });

        } catch (error) {
            console.error(error);
            return reply.status(500).send(`Serverda xatolik: ${error.message}`);
        }
    });

    fastify.post('/signup/verify', async (req, reply) => {
        try {
            const { phone_number, code } = req.body;
            const otpHoder = await otpModel.find({ phone_number });
            if (otpHoder.length === 0) return reply.send({
                message: "Tasdiqlash kodi xato yoki muddati tugagan!",
            });

            const lastOtpFind = otpHoder[otpHoder.length - 1];
            const validUser = await bcrypt.compare(code, lastOtpFind.otp);

            if (!validUser) return reply.send({
                message: "Tasdiqlash kodi xato yoki muddati tugagan!",
            });

            if (lastOtpFind.phone_number === phone_number && validUser) {
                let user = await userModel.findOne({ phone_number });
                if (!user) return reply.send({
                    message: "Bunday foydalanuvchi topilmadi"
                });

                user.verified = true;
                user.role = "admin";
                user.username = slugify(`${user.firstname}-${generateOTP(4)}`);

                const token = await generateToken({
                    _id: user._id,
                    phone_number: phone_number
                });

                user = await user.save();
                await otpModel.deleteMany({ phone_number: lastOtpFind.phone_number });

                return reply.status(200).send({
                    message: "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
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
                message: "Tasdiqlash kodi xato",
            });

        } catch (error) {
            console.error(error);
            return reply.status(500).send(`Serverda xatolik: ${error.message}`);
        }
    });

    fastify.post('/signin', async (req, reply) => {
        try {
            const user = await userModel.findOne({ phone_number: req.body.phone_number });
            if (!user) {
                return reply.send({
                    message: "Telefon raqam xato topilmadi",
                });
            }

            const validPassword = await bcrypt.compare(req.body.password, user.password);
            if (!validPassword) {
                return reply.send({
                    message: "Parolingiz xato",
                });
            }

            if (user.role !== "admin") {
                return reply.send({
                    message: "Siz admin emassiz",
                });
            }

            const token = await generateToken({
                _id: user._id,
                phone_number: user.phone_number,
                role: user.role,
            });

            return reply.status(200).send({
                message: "Muofaqqiyatli kirish",
                token,
                data: {
                    _id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    username: user.username,
                    email: user.email,
                    phone_number: user.phone_number
                },
            });
        } catch (error) {
            console.error(error);
            return reply.status(500).send(`Server Xatosi: ${error.message}`);
        }
    });

    fastify.post('/reset-password', async (req, reply) => {
        try {
            let user = await userModel.findOne({ phone_number: req.body.phone_number });
            if (!user) return reply.status(404).send("Bergan Telefon raqam mavjud emas!");

            const otpCode = generateOTP(4);
            const otp = new otpModel({
                phone_number: user.phone_number,
                otp: otpCode
            });

            const saltOtp = await bcrypt.genSalt(10);
            otp.otp = await bcrypt.hash(otp.otp, saltOtp);
            await otp.save();

            const txt = `${otpCode} - Tasdiqlash kodi.\nKodni hech kimga bermang.\nFiribgarlardan saqlaning.\nKompaniya OLMA.UZ`;
            // const response = await sendSms(user.phone_number, txt);

            return reply.status(200).send(otpCode);
        } catch (error) {
            return reply.status(500).send(error.message);
        }
    });

    fastify.post('/update-password', async (req, reply) => {
        try {
            const user = await userModel.findOne({ _id: req.params.id });
            if (!user) return reply.status(404).send({ message: "Yaroqsiz user id" });

            const token = await tokenModel.findOne({
                userId: user._id,
                token: req.params.token,
            });
            if (!token) return reply.status(404).send({ message: "Yaroqsiz token" });

            if (!user.verified) user.verified = true;
            user.password = req.body.password;
            await user.save();
            await token.deleteOne();
            return reply.status(200).send({ message: "Parol muvaffaqiyatli tiklandi", user });
        } catch (error) {
            return reply.status(500).send(error.message);
        }
    });

}


module.exports = AuthRoutes;