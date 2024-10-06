// services/cronTasks.js
const cron = require('node-cron');
const fileModel = require('../models/file.model'); // Fayl modelini import qilish
const fileService = require("./file.service2");

// Keraksiz fayllarni o'chirish uchun cron job
const fileNotActiveRemove = () => {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const files = await fileModel.find({ isActive: false });

            if (files.length > 0) {
                const deletePromises = files.map(async (file) => {
                    try {
                        // Faylni o'chirish
                        await fileService.remove(file.image.small);
                        await fileService.remove(file.image.large);
                        // Faylni bazadan o'chirish
                        await fileModel.findByIdAndDelete(file._id);
                    } catch (error) {
                        console.error(`Faylni o'chirishda xatolik (ID: ${file._id}):`, error);
                    }
                });

                // Barcha fayllarni o'chirishni kuting
                await Promise.all(deletePromises);
                console.log(`${files.length} keraksiz fayl o'chirildi`);
            } else {
                console.log('O\'chiriladigan keraksiz fayllar yo\'q.');
            }
        } catch (err) {
            console.error('Fayl o\'chirishda xatolik:', err);
        }
    });

    console.log('Keraksiz fayllar o\'chirish funksiyasi ishga tushdi!');
};

// Bu vazifani eksport qilish
module.exports = { fileNotActiveRemove };
