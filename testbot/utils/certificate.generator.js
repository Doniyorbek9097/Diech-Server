const { CreateImage } = require('./CreateImage')

class Image {
// image-1
async certificate1({user:{ user, ball }, test: {keyword, code, author}}) {
    const text = `Assalumu aleykum hurmatli ${user.firstname} ${user.lastname}, siz Online testimizda ishtirok etib 1 ta (100%) natija ko'rsatganligingiz uchun ${author.firstname} ${author.lastname} tomonidan ushbu sertifikat bilan taqdirlandingiz! Testdagi ishtirokingiz uchun alohida tashakkur bildiramiz. Kelgusi testlarimizda ham foal bo'lishingizni so'rab qolamiz.`;
    
    const certGen = new CreateImage('./testbot/certificates/image-1.jpg');
    await certGen.init()
    await certGen.addText({text:`${user.firstname} ${user.lastname}`, x:1000, y:660, fontSize:100, color:'white'})  // Matnni rasm ustiga chizish
    await certGen.addText({text:text, x:1000, y:780, color:'white'})
    // await certGen.addText({text:date, x:550, y:1150, color:'white'})
    await certGen.addText({text:`${author.firstname} ${author.lastname}`, x:1450, y:1150, color:'white'})
    // await certGen.addImage('./sertificat/image-1.jpg', 350, 500, 100, 100) 
    await certGen.save('./testbot/certificate.jpg');  // Faylni saqlash
}


// image-2 
async certificate2({user:{ user, ball }, test: {keyword, code, author}}) {
    const text = `Assalumu aleykum hurmatli ${user.firstname} ${user.lastname}, siz Online testimizda ishtirok etib 1 ta (100%) natija ko'rsatganligingiz uchun ${author.firstname} ${author.lastname} tomonidan ushbu sertifikat bilan taqdirlandingiz! Testdagi ishtirokingiz uchun alohida tashakkur bildiramiz. Kelgusi testlarimizda ham foal bo'lishingizni so'rab qolamiz.`;

    const certGen = new CreateImage('./testbot/certificates/image-2.jpg');
    await certGen.init()
    await certGen.addText({text:`${user.firstname} ${user.lastname}`, x:1000, y:630, fontSize:100})  // Matnni rasm ustiga chizish
    await certGen.addText({text, x:1000, y:750})
    // await certGen.addText('cursive', 32, date, 600, 1100, 1000, 50, 'black')
    await certGen.addText({text: `${author.firstname} ${author.lastname}`, x:1400, y:1100})
    // await certGen.addImage('./sertificat/image-1.jpg', 350, 500, 100, 100) 
    await certGen.save('./testbot/certificate.jpg');  // Faylni saqlash
}


//image-3 

async certificate3({user:{ user, ball }, test: {keyword, code, author}}) {
    const text = `Assalumu aleykum hurmatli ${user.firstname} ${user.lastname}, siz Online testimizda ishtirok etib 1 ta (100%) natija ko'rsatganligingiz uchun ${author.firstname} ${author.lastname} tomonidan ushbu sertifikat bilan taqdirlandingiz! Testdagi ishtirokingiz uchun alohida tashakkur bildiramiz. Kelgusi testlarimizda ham foal bo'lishingizni so'rab qolamiz.`;

    const certGen = new CreateImage('./testbot/certificates/image-3.jpg');
    await certGen.init()
    await certGen.addText({text:`${user.firstname} ${user.lastname}`, x:1000, x:620, fontSize: 100})  // Matnni rasm ustiga chizish
    await certGen.addText({text, x:1000, y:750})
    // await certGen.addText('cursive', 32, date, 610, 1150, 1000, 50, 'black')
    await certGen.addText({text:`${author.firstname} ${author.lastname}`, x:1400, y:1150})
    // await certGen.addImage('./sertificat/image-1.jpg', 350, 500, 100, 100) 
    await certGen.save('./testbot/certificate.jpg');  // Faylni saqlash
};


// image-4  
async certificate4({user:{ user, ball }, test: {keyword, code, author}}){
    const text = `Assalumu aleykum hurmatli ${user.firstname} ${user.lastname}, siz Online testimizda ishtirok etib 1 ta (100%) natija ko'rsatganligingiz uchun ${author.firstname} ${author.lastname} tomonidan ushbu sertifikat bilan taqdirlandingiz! Testdagi ishtirokingiz uchun alohida tashakkur bildiramiz. Kelgusi testlarimizda ham foal bo'lishingizni so'rab qolamiz.`;

    const certGen = new CreateImage('./testbot/certificates/image-4.jpg');
    await certGen.init()
    await certGen.addText({text:`${user.firstname} ${user.lastname}`, x:900, y:620, fontSize:100})  // Matnni rasm ustiga chizish
    await certGen.addText({text:text, x:900, y:800})
    // await certGen.addText('cursive', 32, date, 200, 1300, 1000, 50, 'black')
    await certGen.addText({text:`${author.firstname} ${author.lastname}`, x:800, y:1300})
    // await certGen.addImage('./sertificat/image-1.jpg', 350, 500, 100, 100) 
    await certGen.save('./testbot/certificate.jpg');  // Faylni saqlash
};


}

module.exports = { generate: new Image() };