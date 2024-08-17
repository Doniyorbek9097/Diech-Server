const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.TESTBOT_MONGO_URL);
        console.log("MongoDBga muvaffaqiyatli ulanildi!")
    } catch (error) {
        console.log(error)
    }
}

connectDB();