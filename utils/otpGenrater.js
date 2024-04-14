const otpGenrator = require("otp-generator")
exports.generateOTP = (num) => {
    return otpGenrator.generate(num, {
        upperCaseAlphabets:false,
        specialChars:false,
        lowerCaseAlphabets:false,
    })
}