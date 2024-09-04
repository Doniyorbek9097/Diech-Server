const { Scenes: { BaseScene }, Markup } = require("telegraf");
const testModel = require("../models/test.model")
const userModel = require("../models/user.model")
const { generate } = require("../utils/certificate.generator")

const certificateScene = new BaseScene("certificateScene")


certificateScene.enter(async (ctx) => {
    try {
        
        const user = await userModel.findOne({ 'userid': ctx.chat.id });
        const tests = await testModel.find({ 'answers.user': { $in: [user._id] }, 'answers.certificate_issued': {$in: [false]} })
        if (!tests?.length) {
            ctx.replyWithHTML("<i>❌ Kechirasiz sizda testlar bo'yicha yangi sertifikatlar mavjud emas. Testlarda ishtirok etishda davom eting.</i>");
            return ctx.scene.enter("startScene")
        }

        const buttons = tests.map(item => item.code.toString()); // Each code in a new line

        ctx.replyWithHTML("<b>🏅 Qaysi test bo'yicha sertifikatingizni olmoqchisiz. Kerakli test kodini tanlang.</b>", {
            ...Markup.keyboard([
                ...buttons.chunk(3),
                ["🔙 Orqaga qaytish"]
            ]).resize()
        })
    } catch (error) {
        console.log(error);
        ctx.reply(error.message)
    }
})


certificateScene.on("text", async (ctx) => {
    try {

        if (ctx.message.text == `🔙 Orqaga qaytish` || ctx.message.text == `/start`) {
            return ctx.scene.enter("startScene")
        }

        const test = await testModel.findOne({ 'code': ctx.message.text })
            .populate({
                path: "author"
            })
            .populate({
                path: "answers.user",
                match: { 'userid': ctx.chat.id }
            });

        if (!test) {
            console.log('Test topilmadi');
            return;
        }


        // Faqat mavjud bo'lgan 'answers' massivdan biror narsa topish
        const answer = test.answers.find(item => {
            if (item.user && item.user.userid.toString() === ctx.chat.id.toString()) {
                return item;
            }
        });

        switch (test.author.template) {
            case 'image-1.jpg':
                await generate.certificate1({ user: answer, test })
                await ctx.replyWithDocument({
                    source: "./testbot/certificate.jpg",
                    caption: "Sertifikatingiz tayyor!",
                    parse_mode: 'HTML'
                });
                break;
            case 'image-2.jpg':
                await generate.certificate2({ user: answer, test })
                await ctx.replyWithDocument({
                    source: "./testbot/certificate.jpg",
                    caption: "Sertifikatingiz tayyor!",
                    parse_mode: 'HTML'
                });

                break;
            case 'image-3.jpg':
                await generate.certificate3({ user: answer, test })
                await ctx.replyWithDocument({
                    source: "./testbot/certificate.jpg",
                    caption: "Sertifikatingiz tayyor!",
                    parse_mode: 'HTML'
                });

                break;
            case 'image-4.jpg':
                await generate.certificate4({ user: answer, test })
                await ctx.replyWithDocument({
                    source: "./testbot/certificate.jpg",
                    caption: "Sertifikatingiz tayyor!",
                    parse_mode: 'HTML'
                });
                break;
        }

    
        await testModel.updateOne(
            { 'answers.user': answer.user._id },
            { $set: { 'answers.$.certificate_issued': true } }
          );
        await ctx.scene.enter("startScene")

    } catch (error) {
        console.error(error);
        ctx.reply(error.message)
    }
});



certificateScene.hears("🔙 Orqaga qaytish", async (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.scene.enter('startScene');
    }
})


module.exports = certificateScene;