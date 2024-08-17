const { Scenes:{WizardScene}, Markup } = require("telegraf");


const createBlokTest = new WizardScene("createBlokTest", 
    (ctx) => {
        ctx.reply("createBlokTest")
    }
)


createBlokTest.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.reply('Oldingi sahna mavjud emas');
    }
})


module.exports = createBlokTest;