const orderModel = require("../../models/order.model");
const otpModel = require("../../models/otp.model");
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const bcrypt = require("bcrypt");
const productModel = require("../../models/product.model")
const { checkToken } = require("../../middlewares/authMiddleware");
const shopProductModel = require("../../models/shop.product.model")

const orderRoutes = async(fastify, options) => {
try {
        // GET /order-all
fastify.get('/order-all', { preHandler: checkToken }, async (req, reply) => {
    try {
        const orders = await orderModel.find();
        reply.send({ message: 'success', data: orders });

        for (const order of orders) {
            for (const productData of order.products) {
                const product = await shopProductModel.findById(productData.product?._id);

                if (product) {
                    let target = product;
                    if (product.variants && product.variants.length > 0) {
                        target = product.variants.find(variant => variant._id.toString() === productData.selected_variant._id.toString()) || product;
                    }

                    const statusActions = {
                        soldOut: () => {
                            if (!target.soldOut.some(item => item.toString() === order._id.toString())) {
                                const returnedIndex = target.returned.findIndex(item => item.toString() === order._id.toString());
                                if (returnedIndex !== -1 && target.returnedCount > 0) {
                                    target.returned.splice(returnedIndex, 1);
                                    target.returnedCount -= productData.quantity;
                                }
                                target.soldOut.push(order._id);
                                target.soldOutCount += productData.quantity;
                                target.quantity -= productData.quantity;
                            }
                        },
                        returned: () => {
                            if (!target.returned.some(item => item.toString() === order._id.toString())) {
                                const soldIndex = target.soldOut.findIndex(item => item.toString() === order._id.toString());
                                if (soldIndex !== -1 && target.soldOutCount > 0) {
                                    target.soldOut.splice(soldIndex, 1);
                                    target.soldOutCount -= productData.quantity;
                                }
                                target.returned.push(order._id);
                                target.returnedCount += productData.quantity;
                                target.quantity += productData.quantity;
                            }
                        }
                    };

                    statusActions[productData.status]?.();
                    await product.save();
                }
            }
        }
    } catch (error) {
        console.error(error);
        reply.status(500).send({ message: error.message });
    }
});

// GET /order/:id
fastify.get('/order/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
        const order = await orderModel.findById(req.params.id).populate({ path: 'products.shop' });
        reply.send({ data: order, message: 'success' });
    } catch (error) {
        console.log(error);
        reply.status(500).send(error.message);
    }
});

// PUT /order-update/:id
fastify.put('/order-update/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
        const updated = await orderModel.findByIdAndUpdate(req.params.id, req.body);
        reply.send({ data: updated, message: 'success updated' });
    } catch (error) {
        console.log(error.message);
        reply.status(500).send(error.message);
    }
});

// DELETE /order-delete/:id
fastify.delete('/order-delete/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
        const deleted = await orderModel.findByIdAndDelete(req.params.id);
        reply.send({ data: deleted, message: 'Success deleted' });
    } catch (error) {
        console.log(error);
        reply.status(500).send(error.message);
    }
});

} catch (error) {
    console.log(error);    
}

}

module.exports = orderRoutes;