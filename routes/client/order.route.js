const orderModel = require("../../models/order.model");
const cartModel = require("../../models/cart.model")
const otpModel = require("../../models/otp.model");
// const router = require("express").Router();
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");
// const bot = require("../../bot");
const userModel = require("../../models/user.model")
const { Markup } = require("telegraf")
const orderRoutes = async (fastify, options) => {
    fastify.post('/order-add', async (request, reply) => {
        try {
            const { customerInfo, products, cart_id } = request.body;
            const newOrder = await new orderModel(request.body).save();
            await cartModel.findByIdAndDelete(cart_id);
            const deliverers = await userModel.find({ role: "deliverer" });

            deliverers.forEach(user => {
                let text = `<i>${customerInfo.username} <b>${products.length}</b> ta mahsulotga buyurtma berdi!</i>`;
                // bot.telegram.sendMessage(user?.telegramAccount?.id, text, { parse_mode: "HTML" }).catch(err => console.log(err?.message));
            });

            return {
                data: newOrder,
                message: "success"
            };

        } catch (error) {
            console.error(error);
            reply.status(500).send(error.message);
        }
    });

    fastify.get('/product-statistic', async (request, reply) => {
        try {
            const sort = request.query.sort || "";
            const orders = await orderModel.find()
                .sort({ createdAt: -1 });

            return {
                data: orders.flatMap(order => order.products.filter(item => item.status === sort)),
                message: "success"
            };

        } catch (error) {
            console.error(error);
            reply.status(500).send(error.message);
        }
    });
};

module.exports = orderRoutes;
