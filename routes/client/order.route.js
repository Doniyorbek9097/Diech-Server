const orderModel = require("../../models/order.model");
const cartModel = require("../../models/cart.model")
const otpModel = require("../../models/otp.model");
// const router = require("express").Router();
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");
// const bot = require("../../bot");
const userModel = require("../../models/user.model")
const { Markup } = require("telegraf");
const shopProductModel = require("../../models/shop.product.model");
const orderRoutes = async (fastify, options) => {
    fastify.post('/order-add', async (req, reply) => {
        try {
            const { customerInfo, products, cart_id } = req.body;
            req.body.products = await Promise.all(products.map(async(item) => {
                const product = await shopProductModel.findById(item.product_id).lean()
                return {
                    quantity: item.quantity,
                    ...product,
                }
            }));

            const newOrder = await new orderModel(req.body).save();
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
            return reply.status(500).send(error.message);
        }
    });

    fastify.get('/product-statistic', async (req, reply) => {
        try {
            const sort = req.query.sort || "";
            const orders = await orderModel.find()
                .sort({ createdAt: -1 });

            return {
                data: orders.flatMap(order => order.products.filter(item => item.status === sort)),
                message: "success"
            };

        } catch (error) {
            console.error(error);
            return reply.status(500).send(error.message);
        }
    });
};

module.exports = orderRoutes;
