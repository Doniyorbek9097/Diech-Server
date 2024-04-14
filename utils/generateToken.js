const jwt = require("jsonwebtoken");

exports.generateToken = async function (data, options) {
    const token = jwt.sign(
        data,
        process.env.JWT_SECRET_KEY,
        options
    );

    // {expiresIn:"7d"}
    
    return token;
}
