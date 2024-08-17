const { Scenes:{WizardScene}, Markup } = require("telegraf");


const createSubjectTest = new WizardScene("createSubjectTest", 
    (ctx) => {
        ctx.reply("createSubjectTest")
    }
)


createSubjectTest.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.reply('Oldingi sahna mavjud emas');
    }
})


module.exports = createSubjectTest;