const Jwt = require("jsonwebtoken")

exports.checkToken = (req, res, next) => {
 const headerToken =  req.headers.token;
 if(headerToken){
 	 req.token = headerToken;
   Jwt.verify(req.token, process.env.JWT_SECRET_KEY, (err, authData) => {
     if(!err) {
      return next()
     } 
     else {
       console.log("token haqiqiy emas!")
      return res.status(403).json("token haqiqiy emas!");
     } 
     
   })


 }else{
 	 return res.status(404).json("Token topilamadi");
 }

}

