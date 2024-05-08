const { Markup } = require("telegraf");
const orderModel = require("../../models/order.model");


exports.findOneOrder = async (order_id) => {
    try {
        const order = await orderModel.findById(order_id)
            .populate({
                path: "products.product",
                populate: {
                    path: "shop"
                }
            })

            .populate({
                path: "products.product",
                populate: {
                    path: "owner"
                }
            });


        const { customerInfo, products, user, address, status, location, delivery, totalAmount, cart_id } = order;
        let text = `
<i>🙎Buyurtmachi:</i> <b>${customerInfo?.username}</b>
<i>🚩Viloyat:</i> <b>${address?.region}</b>
<i>🚩Tuman:</i> <b>${address?.distirct}</b>
<i>🚩MFY:</i> <b>${address?.mfy}</b>
<i>🚩Ko'cha:</i> <b>${address?.street}</b>
<i>🏡Uy raqami:</i> <b>${address?.house}</b>
<i>🏬Uy qavvati:</i> <b>${address?.house}</b>
<i>🤳Telefon raqami:</i> <b>${customerInfo?.phone_number}</b>

<i>🚛Yetkazib berish usuli:</i> <b>${delivery?.method}</b>
<i>📅Yetkazib berish sanasi:</i> <b>${delivery?.time}</b>
<i>💲Yetkazib berish narxi:</i> <b>${delivery?.price} so'm</b>
<i>💲Jam mahsulotlar narxi:</i> <b>${totalAmount} so'm</b>
<i>✍️Kuyuer uchun izoh:</i> <b>${delivery?.comment}</b>

<i>🛒 Barcha Mahsulotlar 👇👇👇</i>`;

        const buttons = [
            [Markup.button.callback(`🗺️Joylashuv manzili`, JSON.stringify(location))],
            [Markup.button.callback(`🚛Order holati ${status}`, `default`)],
            [Markup.button.callback(`${status == 'new' ? '🆕' : ''} Yangi`, `new`),
            Markup.button.callback(`${status == 'progress' ? '🔃' : ''} Tayyorlanmoqda`, `progress`)],
            [Markup.button.callback(`${status == 'shipping' ? '🚛' : ''} Yuborilmoqda`, `shipping`),
            Markup.button.callback(`${status == 'canceled' ? '❌' : ''} Bekor qilindi`, `canceled`),
            Markup.button.callback(`${status == 'sent' ? '✅' : ''} Yetkazildi`, `sent`)],
        ]

        
        products.forEach((item, i) => {
            text += `\n-----------------\n🏪Do'kon: ${item?.product?.shop?.name}\n🛍️${item?.product?.name}\n${parseInt(item.quantity)} x ${parseInt(item?.product?.sale_price)} = ${parseInt(item?.product?.sale_price) * parseInt(item.quantity)} so'm`;
            buttons.push(
                [Markup.button.url(`🛍️${item.product.name}`, `${process.env.CLIENT_URL}/product/view/${item?.product?.slug}`)],
                [Markup.button.callback(`${item.status == 'notSold' ? '🟡' : ''} Sotilmagan`, `notSold ${i}`),
                Markup.button.callback(`${item.status == 'soldOut' ? '🟢' : ''} Sotildi`, `soldOut ${i}`),
                Markup.button.callback(`${item.status == 'returned' ? '🔴' : ''} Qaytarildi`, `returned ${i}`)],
            )
        })


        return {
            order,
            text,
            buttons
        }

    } catch (error) {
        console.log(error)
    }
}