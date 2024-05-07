const { Scenes: { WizardScene }, Markup } = require("telegraf");
const orderModel = require("../../models/order.model");

const orderScene = new WizardScene("orderScene",
    async (ctx) => {
        try {
            const orders = await orderModel.find();
            if (!orders?.length) return ctx.reply("Hozircha buyurtmalar mavjud emas!");
            const buttons = orders.reduce((acc, item) => item.delivery.method == "online" ? acc.concat(Markup.button.callback(`${item.customerInfo.username} (${item.status})`, `${item._id}`)) : acc, [])
            ctx.reply("Barcha buyurtmalar", {
                ...Markup.inlineKeyboard(buttons, { columns: 2 })
            })

            await ctx.deleteMessage().catch(err => { })
            ctx.wizard.next()
        } catch (error) {
            console.log(error)
            ctx.reply(error.message)
        }
    },

    async (ctx) => {
        try {
            if (!ctx?.callbackQuery) return;
            const order_id = ctx?.callbackQuery?.data;
            const order = await orderModel.findById(order_id)
            if (!order) return;
            ctx.wizard.state.order = order;
            const { customerInfo, products, user, address, status, location, delivery, totalAmount, cart_id } = order;
            let text = `
    <b>Buyurtmachi</b>: ${customerInfo?.firstname}
    <b>Viloyat:</b>: ${address?.region}
    <b>Tuman:</b>: ${address?.distirct}
    <b>MFY:</b>: ${address?.mfy}
    <b>Ko'cha:</b>: ${address?.street}
    <b>Uy raqami:</b>: ${address?.house}
    <b>Uy qavvati:</b>: ${address?.house}
    <b>Telefon raqami</b>: ${customerInfo?.phone_number}
    
    <b>Yetkazib berish usuli:</b>: ${delivery?.method}
    <b>Yetkazib berish sanasi</b>: ${delivery?.time}
    <b>Kuyuer uchun izoh</b>: ${delivery?.comment}
    <b>Yetkazib berish narxi</b>: ${delivery?.price}
    <b>Jam mahsulotlar narxi</b>: ${totalAmount}
        
    <b>🛍️ Barcha Mahsulotlar 👇👇👇</b>`;

            for (const item of products) {
                text += `-----------------\n${item.product.name} - ${parseInt(item.quantity)} x ${parseInt(item.product.sale_price)} = ${parseInt(item.product.sale_price) * parseInt(item.quantity)} so'm\n`
            }


            const buttons = [
                Markup.button.callback(`Joylashuv manzili`, `${JSON.stringify(location)}`),
                Markup.button.callback(`${status == 'new' && '✔️'} Mahsulot tasdiqlandi`, `new`),
                Markup.button.callback(`${status == 'progress' && '✔️'} Mahsulot tayyorlanmoqda`, `progress`),
                Markup.button.callback(`${status == 'shipping' && '✔️'} Mahsulot yuborildi`, `shipping`),
                Markup.button.callback(`${status == 'canceled' && '✔️'} Mahsulot bekor qilindi`, `canceled`),
                Markup.button.callback(`${status == 'sent' && '✔️'} Mahsulot yetkazildi`, `sent`),
                Markup.button.callback(`Orqaga`, `back`),
            ]

            await ctx.replyWithHTML(text, Markup.inlineKeyboard(buttons, { columns: 2 }));

        } catch (error) {
            console.log(error)
            ctx.reply(error.message)
        }
    },

);




orderScene.action("back", async ctx => {
    ctx.callbackQuery.data = ctx.wizard.state.order_id;
    ctx.wizard.back()
    ctx.wizard.step(ctx)
    ctx.deleteMessage().catch(err => { })
    return;

})

orderScene.on("callback_query", async (ctx, next) => {
    const query = ctx.callbackQuery.data;
    const searchedWords = ["new", "progress", "shipping", "canceled", "sent"];
    if (!searchedWords.includes(query)) return next();
    const { order:orderData } = ctx.wizard.state;

    const order = await orderModel.findByIdAndUpdate(orderData._id, { status: query });

    const { customerInfo, products, user, address, status, location, delivery, totalAmount, cart_id } = order;
    let text = `
<b>Buyurtmachi</b>: ${customerInfo?.firstname}
<b>Viloyat:</b>: ${address?.region}
<b>Tuman:</b>: ${address?.distirct}
<b>MFY:</b>: ${address?.mfy}
<b>Ko'cha:</b>: ${address?.street}
<b>Uy raqami:</b>: ${address?.house}
<b>Uy qavvati:</b>: ${address?.house}
<b>Telefon raqami</b>: ${customerInfo?.phone_number}

<b>Yetkazib berish usuli:</b>: ${delivery?.method}
<b>Yetkazib berish sanasi</b>: ${delivery?.time}
<b>Kuyuer uchun izoh</b>: ${delivery?.comment}
<b>Yetkazib berish narxi</b>: ${delivery?.price}
<b>Jam mahsulotlar narxi</b>: ${totalAmount}

<b>🛍️ Barcha Mahsulotlar 👇👇👇</b>`;

    for (const item of products) {
        text += `-----------------\n${item.product.name} - ${parseInt(item.quantity)} x ${parseInt(item.product.sale_price)} = ${parseInt(item.product.sale_price) * parseInt(item.quantity)} so'm\n`
    }

    const buttons = [
        Markup.button.callback(`Joylashuv manzili`, `${JSON.stringify(location)}`),
        Markup.button.callback(`${status == query && '✔️'} Mahsulot tasdiqlandi`, `new`),
        Markup.button.callback(`${status == query && '✔️'} Mahsulot tayyorlanmoqda`, `progress`),
        Markup.button.callback(`${status == query && '✔️'} Mahsulot yuborildi`, `shipping`),
        Markup.button.callback(`${status == query && '✔️'} Mahsulot bekor qilindi`, `canceled`),
        Markup.button.callback(`${status == query && '✔️'} Mahsulot yetkazildi`, `sent`),
        Markup.button.callback(`Orqaga`, `back`),
    ]


    ctx.editMessageText(text, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
            buttons
        ],{columns:2})
    })
})



module.exports = orderScene;