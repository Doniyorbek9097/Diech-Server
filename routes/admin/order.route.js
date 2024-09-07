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
        return reply.send({ message: 'success', data: orders });

    } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: error.message });
    }
});

// GET /order/:id
fastify.get('/order/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
        const order = await orderModel.findById(req.params.id)
        .populate('products.owner')
        .populate('products.shop')

        return  reply.send({ data: order, message: 'success' });
    } catch (error) {
        console.log(error);
        return reply.status(500).send(error.message);
    }
});

// PUT /order-update/:id
fastify.put('/order-update/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
        const order = await orderModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) {
            return reply.status(404).send({ message: 'Order not found' });
        }

        // Har bir mahsulot uchun loop
        for (const productData of order.products || []) {
            const product = await shopProductModel.findById(productData?._id);

            if (product) {
                let target = product;
                
                // Agar variantlar mavjud bo'lsa va tanlangan bo'lsa
                if (product.variants?.length > 0 && productData.selected_variant?._id) {
                    target = product.variants.find(variant => variant._id.toString() === productData.selected_variant._id.toString()) || product;
                }

                // Sotish holati
                if (productData.status === 'soldOut') {
                    if (!target.soldOut.includes(order._id.toString())) {
                        // Mahsulotni qaytarilgan ro'yxatdan olib tashlaymiz
                        const returnedIndex = target.returned.indexOf(order._id.toString());
                        if (returnedIndex !== -1 && target.returnedCount > 0) {
                            target.returned.splice(returnedIndex, 1);
                            target.returnedCount -= productData.quantity;
                        }
                        // Sotilgan ro'yxatga qo'shamiz va miqdorini yangilaymiz
                        target.soldOut.push(order._id);
                        target.soldOutCount += productData.quantity;
                        target.quantity -= productData.quantity;
                    }
                }
                
                // Qaytarish holati
                if (productData.status === 'returned') {
                    if (!target.returned.includes(order._id.toString())) {
                        // Mahsulotni sotilgan ro'yxatdan olib tashlaymiz
                        const soldIndex = target.soldOut.indexOf(order._id.toString());
                        if (soldIndex !== -1 && target.soldOutCount > 0) {
                            target.soldOut.splice(soldIndex, 1);
                            target.soldOutCount -= productData.quantity;
                        }
                        // Qaytarilgan ro'yxatga qo'shamiz va miqdorini yangilaymiz
                        target.returned.push(order._id);
                        target.returnedCount += productData.quantity;
                        target.quantity += productData.quantity;
                    }
                }

                // Mahsulotni saqlash
                await product.save();
            }
        }

        return reply.send({ data: order, message: 'Order successfully updated' });
    } catch (error) {
        console.error(error.message);
        return reply.status(500).send({ message: error.message });
    }
});


// DELETE /order-delete/:id
fastify.delete('/order-delete/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
        const deleted = await orderModel.findByIdAndDelete(req.params.id);
        return reply.send({ data: deleted, message: 'Success deleted' });
    } catch (error) {
        console.log(error);
        return reply.status(500).send(error.message);
    }
});

} catch (error) {
    console.log(error);    
}

}

module.exports = orderRoutes;