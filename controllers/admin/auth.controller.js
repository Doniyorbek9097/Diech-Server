const tokenModel = require("../../models/token.model");
const otpModel = require("../../models/otp.model");
const userModel = require("../../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcrypt")
const sendEmail = require("../../utils/sendEmail");
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const { generateToken } = require("../../utils/generateToken")

class Auth {
   async user(req, reply) {
        try {
            const user = await userModel.findById(req.params.id)
            !user ?  reply.status(500).send({
                message: "Token xato"
            })
            :
            reply.send({
                message: "success",
                data: user
            })
    
        } catch (error) {
            console.log(error);
            return reply.status(500).send("Serverda Xatolik " + error.message)
        }
    }
}



module.exports = new Auth();