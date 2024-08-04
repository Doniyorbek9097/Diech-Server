const mongoose = require("mongoose");
const mongooseIntl = require('mongoose-intl');
const mongoosastic = require("mongoosastic")
const { Client } = require('@elastic/elasticsearch');
const esClient = new Client(
  { 
    node: 'https://elasticsearch-7-17-0.onrender.com',
    requestTimeout: 30000,
    // ssl: {
    //   rejectUnauthorized: false,
    // },
  }
);



async function createIndex() {
  try {
    const indexExists = await esClient.indices.exists({ index: 'products' });
    if (!indexExists) {
      const response = await esClient.indices.create({
        index: 'products',
        body: {
          mappings: {
            properties: {
              name_uz: { 
                type: 'text',
                analyzer: 'standard', // Matnlarni indekslash uchun standart analizator
                search_analyzer: 'standard' // Qidiruv uchun standart analizator
              },

              name_ru: { 
                type: 'text',
                analyzer: 'standard', // Matnlarni indekslash uchun standart analizator
                search_analyzer: 'standard' // Qidiruv uchun standart analizator
              },

              keywords_uz: { 
                type: 'text',
                analyzer: 'keyword', // Kalit so'zlarni tahlil qilish
                search_analyzer: 'keyword' // Qidiruv uchun kalit so'z analizatori
              },

              keywords_ru: { 
                type: 'text',
                analyzer: 'keyword', // Kalit so'zlarni tahlil qilish
                search_analyzer: 'keyword' // Qidiruv uchun kalit so'z analizatori
              },
              barcode: { type: 'keyword' } // Unikal qiymatlarni saqlash uchun
            }
          }
        }
      });
      console.log('Index yaratildi:', response);
    } else {
      console.log('Index mavjud');
    }
  } catch (error) {
    console.error('Index yaratishda xatolik:', error);
  }
}

// createIndex();


// async function testConnection() {
//   try {
//     const health = await esClient.cluster.health({});
//     console.log('Elasticsearch klaster holati:', health);
//   } catch (error) {
//     console.error('Elasticsearch bilan bog\'lanishda xatolik:', error);
//   }
// }

// testConnection();

// elastic login 
// -*bMxoMFSxmLHbB9mfXU elastic password
// elastic token eyJ2ZXIiOiI4LjE0LjAiLCJhZHIiOlsiMTkyLjE2OC4xLjEwNTo5MjAwIl0sImZnciI6IjA2N2U1MmFlMTFhMTYzMDU0MzZjMDVlMDMxY2NhMzAwMDkwMDQ3M2M5Nzk1MTU3Y2MyZWVkOWM1MTdlM2M2NGYiLCJrZXkiOiJ1UTVMN1pBQjA5ck1OWTIxVTYwRjpFdGI5OFIweVJWYVhGbFdHM3picDhBIn0=
mongoose.plugin(mongooseIntl, { languages: ['uz', 'ru'], defaultLanguage: 'uz', vertuals: {} });
// mongoose.plugin(mongoosastic, {
//   host: "localhost",
//   port: 9200
// })



const connectDB = async () => {
    try {
      const connect =  await mongoose.connect(process.env.MONGO_URL,  { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("MongoDBga muvaffaqiyatli ulanildi!")
    } catch (error) {
        console.log(error)
    }   
}

connectDB();

module.exports = {
  esClient,
  connectDB
}