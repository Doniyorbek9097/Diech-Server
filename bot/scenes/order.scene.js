const { Scenes: { WizardScene }, Markup } = require("telegraf");
const orderModel = require("../../models/order.model");
const { isObject } = require("../methods")
const { checkToken, startMiddleware } = require("../../middlewares/authBotMiddleware")
const { findOneOrder } = require("../utils")

const orderScene = new WizardScene("orderScene",
    async (ctx) => {
        try {
            const orders = await orderModel.find();
            if (!orders?.length) return ctx.reply("Hozircha buyurtmalar mavjud emas!");
            const buttons = orders.reduce((acc, item) => item.delivery.method == "online" ? acc.concat(Markup.button.callback(`${item.customerInfo.username} (${item.status})`, `${item._id}`)) : acc, [])
            ctx.editMessageText("<i>Barcha buyurtmalar ro'yxati</i>", {
                parse_mode:"HTML",
                ...Markup.inlineKeyboard([
                    ...buttons.chunk(2),
                    [Markup.button.callback("🔙Orqaga", "homeScene")]
                ])
            }).catch(err => {})

            ctx.wizard.next()
        } catch (error) {
            console.log(error)
            ctx.reply(error.message).catch(err => {})
        }
    },

    async (ctx) => {
        try {
            if (!ctx?.callbackQuery) return;
            const order_id = ctx?.callbackQuery?.data;
            const {order, text, buttons} = await findOneOrder(order_id)
            .catch(err => ctx.answerCbQuery("Bunday buyurtma topilmadi", {show_alert: true}));

            if (!order) return;
            ctx.wizard.state.order = order;
            
    
            await ctx.editMessageText(text, {
                parse_mode:"HTML",
                ...Markup.inlineKeyboard([
                    ...buttons,
                    [Markup.button.callback("🔙Orqaga", "back")]
                ]),
            }).catch(err => {})


        } catch (error) {
            console.log(error.message)
            ctx.reply(error.message).catch(err => {})
        }
    },

);



orderScene.action("homeScene", async ctx => {
    await ctx.scene.enter("homeScene").catch(err => {})
    ctx.deleteMessage().catch(err => {})  
})

orderScene.action("back", async ctx => {
    ctx.callbackQuery.data = ctx.wizard.state.order_id;
    ctx.wizard.back()
    ctx.wizard.step(ctx).catch(err => {});

    return;

})

orderScene.on("callback_query", async (ctx, next) => {
    const query = ctx.callbackQuery.data;
    const searchedOrderStatus = ["new", "progress", "shipping", "canceled", "sent"];
    const searchProductStatus = ["notSold", "soldOut", "returned"];
    const { order } = ctx.wizard.state;

    const [ splitQuery, index ] = query.split(" "); 
    if (searchedOrderStatus.includes(query)) order.status = query;

    else if(splitQuery && searchProductStatus.includes(splitQuery)) 
        order.products[index].status = splitQuery;

    else if(isObject(query)) {
        const { latitude, longitude } = JSON.parse(query);
        await ctx.sendLocation(latitude, longitude).catch(err => console.log(err))
    }
    else return next()
    

    await orderModel.findByIdAndUpdate(order._id, order);

    const {text, buttons} = await findOneOrder(order._id)
    .catch(err => ctx.answerCbQuery("Bunday buyurtma topilmadi", {show_alert: true}));

    await ctx.editMessageText(text, {
        parse_mode:"HTML",
        ...Markup.inlineKeyboard([
            ...buttons,
            [Markup.button.callback("🔙Orqaga", "back")]
        ])
    }).catch(err => {})

})



orderScene.action("default", ctx => {
   return;
})

orderScene.use(checkToken)
orderScene.use(startMiddleware)

module.exports = orderScene;