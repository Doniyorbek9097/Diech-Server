const { Scenes: { WizardScene }, Markup } = require("telegraf");
const testModel = require("../../models/test.model");
const userModel = require("../../models/user.model");
const { format } = require('date-fns');

const answerMultipleScene = new WizardScene("answerMultipleScene",
    async (ctx) => {
        try {
            const { test } = ctx.wizard.state;
            let text = `Blok test ma'lumotlari:\n`;
            test.keywords.forEach((item, index) => {
                text += `❕ Blok: ${index + 1}\n📚 Fan: ${item.title}\n❔ Savollar: ${item.keyword.length} ta\n📊 Ball: ${item.ball}\n\n`;
            })
            text += `<b>✍️ Yuqorida blok test ma'lumotlari bilan tanishishingiz mumkin va o'z javoblaringizni quyidagicha yuborishingiz zarur.</b>\n1-fan javoblari\n2-fan javoblari\n3-fan javoblari\n...\nM-n:\nabcdbdcbcbdbdbcb\nabcbdbdbbcbcbcbc\nadbabdbaadbcdabd`
            await ctx.replyWithHTML(text);
            ctx.wizard.next();
        } catch (error) {
            console.log(error)
            await ctx.reply(error.message);
        }
    },
    async (ctx) => {
        try {
            const { test } = ctx.wizard.state;
            const user = await userModel.findOne({ userid: ctx.chat.id });
            const date = format(new Date(), 'dd.MM.yyyy HH:mm:ss');
            const answer = ctx.message.text.clearNumber().toLowerCase().split('\n');
            console.log(answer);
            
            if(answer.length !== test.keywords.length) {
                return ctx.replyWithHTML(`${test.code}-testimizda <b>${test.keywords.length}</b> ta savol bor hammasiga javob bering\nMasalan:\nabs3asa\ncaea3a\nawer3af\n shu ketma ketlikda`)
            }

            let allball = 0; // Umumiy ballni saqlaydigan o'zgaruvchi
            let correctAnswerCount = 0; // Umumiy to'g'ri javoblar soni
            let wrongAnswerCount = 0; // Umumiy noto'g'ri javoblar soni
            let result = ''; // Natijalarni saqlaydigan string

            for (const [index, item] of test.keywords.entries()) {
                let blockBall = 0; // Har bir blok uchun ball
                let blockCorrectCount = 0; // Har bir blok uchun to'g'ri javoblar soni
                let blockIncorrectCount = 0; // Har bir blok uchun noto'g'ri javoblar soni
                let blockResult = '';
                if(item.keyword.toLowerCase() === answer[index].toLowerCase()) {
                    allball += Number(item.ball);
                }
                // Javoblarni tekshirish va to'g'ri javoblar sonini hisoblash
                blockResult = item.keyword.toLowerCase().split('').map((ch, i) => {
                    if (i < answer[index].length && ch === answer[index][i]) {
                        blockCorrectCount++;
                        correctAnswerCount++; // Umumiy to'g'ri javoblar sonini oshirish
                        return `${i + 1}-✅`;
                    } else {
                        blockIncorrectCount++;
                        wrongAnswerCount++; // Umumiy noto'g'ri javoblar sonini oshirish
                        return `${i + 1}-❌`;
                    }
                }).join(' ') + '\n'; // Har bir blokdan keyin satr qo'shish
                result += `${item.title} - ${blockResult}\n`;
                // To'g'ri javoblar foizini hisoblash
                blockBall = (blockCorrectCount / item.keyword.length) * 100;
                // allball += blockBall; // Umumiy ballni oshirish

                let text = `💡 Blok: ${index + 1}\n📚 Fan: ${item.title}\n✅ To'g'ri javoblar: ${blockCorrectCount} ta\n❌ Noto'g'ri javoblar: ${blockIncorrectCount} ta\n📊 Sifat: ${blockBall.toFixed(1)}%\n\n${blockResult}`;

                await ctx.replyWithHTML(text);
            }

            // Umumiy ballni to'g'ri hisoblash 
            // allball = (allball / test.keywords.length).toFixed(1);

            await testModel.findByIdAndUpdate(test._id, {
                $push: {
                  answers: {
                    user: user._id,
                    tgid: ctx.chat.id,
                    ball: allball.toFixed(1),
                    status: result,
                    correctAnswerCount: correctAnswerCount,
                    wrongAnswerCount: wrongAnswerCount,
                    date: date,
                  },
                },
              });


            const userText = `<b>💡 Umumiy natija:</b>\n<b>Blok 1:</b> ${allball.toFixed(1)} ball\n<b>❌ Noto'g'ri javoblar:</b> ${wrongAnswerCount} ta\n<b>✅To'g'ri javoblar:</b> ${correctAnswerCount} ta \n\n${result}`;

            const authorText = `${test.code} kodli oddiy testda ${user?.firstname} ${user?.lastname} qatnashdi!\n✅ Natija: ${correctAnswerCount} ta\n🎯 ummumiy ball: ${allball.toFixed(1)} ball\n⏱ ${date}`;

            await ctx.replyWithHTML(userText);

            await ctx.telegram.sendMessage(test.author.userid, authorText, {
                ...Markup.inlineKeyboard([
                    Markup.button.callback("📊Holat", `stat-${test._id}-${user._id}`),
                    Markup.button.callback("⌛️Yakunlash", `closed-${test._id}`)
                ])
            });
            await ctx.scene.enter("startScene");

        } catch (error) {
            console.log(error);
            await ctx.reply(error.message);
        }
    },

);

// answerMultipleScene.use((ctx, next) => ctx?.message?.text && next());
answerMultipleScene.hears('/start', ctx => ctx.scene.enter('startScene'));

answerMultipleScene.hears("🔙 Orqaga qaytish", (ctx) => {
    const previousScene = ctx.session.history.pop();
    if (previousScene) {
        ctx.scene.enter(previousScene);
    } else {
        ctx.scene.enter('startScene');
    }
})


module.exports = answerMultipleScene;
