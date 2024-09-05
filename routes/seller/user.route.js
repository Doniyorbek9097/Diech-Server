const tokenModel = require("../../models/token.model");
const otpModel = require("../../models/otp.model");
const userModel = require("../../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sendEmail = require("../../utils/sendEmail");
const { checkToken } = require("../../middlewares/authMiddleware");
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const { generateToken } = require("../../utils/generateToken");

async function userRoutes(fastify, options) {
    
    // GET user by ID
    fastify.get("/user/:id", { preHandler: checkToken }, async (request, reply) => {
        try {
            const user = await userModel.findById(request.params.id)
                .populate({
                    path: "shop",
                });

            if (user) {
                return reply.send({
                    message: "success",
                    data: user
                });
            }

            return reply.status(500).send("Token xato");

        } catch (error) {
            console.log(error);
            return reply.status(500).send(`Serverda Xatolik ${error.message}`);
        }
    });

    // POST to add a new user
    fastify.post("/user-add", { preHandler: checkToken }, async (request, reply) => {
        try {
            let user = await userModel.findOne({ username: request.body?.username });
            if (user) return reply.send({ message: "bunday username mavjud boshqa username kiriting" });

            user = await userModel.findOne({ phone_number: request.body?.phone_number });
            if (user) return reply.send({ message: "bunday telefon raqam mavjud boshqa raqam kiriting" });

            let newUser = new userModel(request.body);
            newUser.verified = true;
            newUser.username = `user-${newUser._id}`;
            const saltPassword = await bcrypt.genSalt(10);
            newUser.password = await bcrypt.hash(newUser.password, saltPassword);
            newUser.token = await generateToken({
                _id: newUser._id,
                phone_number: newUser.phone_number,
                role: newUser.role
            });
            newUser = await newUser.save();

            return reply.send({
                message: "success created",
                data: newUser
            });
        } catch (error) {
            console.log(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // PUT to update user
    fastify.put("/user-update/:id", { preHandler: checkToken }, async (request, reply) => {
        try {
            let user = await userModel.findOne({ username: request.body?.username });
            if (user) return reply.send({ message: "bunday username mavjud boshqa username kiriting" });

            user = await userModel.findOne({ phone_number: request.body?.phone_number });
            if (user) return reply.send({ message: "bunday telefon raqam mavjud boshqa raqam kiriting" });

            const updated = await userModel.updateOne({ _id: request.params.id }, request.body);
            return reply.send("success updated");
        } catch (error) {
            console.log(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // DELETE user by ID
    fastify.delete("/user-delete/:id", { preHandler: checkToken }, async (request, reply) => {
        try {
            const deleted = await userModel.findByIdAndDelete(request.params.id);
            return reply.status(200).send(deleted);
        } catch (error) {
            console.log(error);
            return reply.status(500).send(`Server xatosi: ${error.message}`);
        }
    });
}

module.exports = userRoutes;
