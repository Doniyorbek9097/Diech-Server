const { Scenes:{BaseScene}, Markup } = require("telegraf");


const createTestMenu = new BaseScene("createTestMenu")

const keywords = Markup.keyboard([
    ["📝 Oddiy test", "📕 Fanli test"],
    ["🗂 Maxsus test", "📚 Blok test"],
    ["🔙 Orqaga qaytish"],

]).resize()


createTestMenu.enter((ctx) => {
    ctx.reply("❕ Kerakli bo'limni tanlang.", keywords)
})

createTestMenu.hears("📝 Oddiy test", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("createTestSimple")
})

createTestMenu.hears("📕 Fanli test", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("subjectScene")
})
createTestMenu.hears("🗂 Maxsus test", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("filesScene")
})
createTestMenu.hears("📚 Blok test", (ctx) => {
    ctx.session.history.push(ctx.scene.current.id) 
    ctx.scene.enter("multipleScene")
})


createTestMenu.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.reply('Oldingi sahna mavjud emas');
    }
})



module.exports = createTestMenu;