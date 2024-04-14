const nodemailer = require("nodemailer");

module.exports = ({email, subject, html}) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: 'smtp.gmail.com',
            secure:true,
            port:587,
            proxy:'http://127.0.0.1:63138',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            }
        });

        
        let options = {
            from: process.env.EMAIL,
            to:email,
            subject,
            html 
        }

    transporter.sendMail(options, (err, info) => {
        if(err) {
            console.log(err)
          resolve(false);
        }else {
          resolve(true)
        }
    });


    });
}



