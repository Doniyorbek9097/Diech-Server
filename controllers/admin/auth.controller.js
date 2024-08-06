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
   async user(req, res) {
        try {
            const user = await userModel.findById(req.params.id)
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
    }
}



module.exports = new Auth();