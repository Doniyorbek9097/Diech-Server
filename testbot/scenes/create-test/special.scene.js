const { Scenes:{WizardScene}, Markup } = require("telegraf");


const createSpecialTest = new WizardScene("createSpecialTest", 
    (ctx) => {
        ctx.reply("createSpecialTest")
    }
)

createSpecialTest.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.reply('Oldingi sahna mavjud emas');
    }
})


module.exports = createSpecialTest;