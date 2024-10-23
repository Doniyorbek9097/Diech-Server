const reviewModel = require("../../models/review.model")
const shopProductModel = require("../../models/shop.product.model");
const fileService = require("../../services/file.service2")


async function reviewRoutes(fastify, options)  {
    fastify.get("/reviews", async (req, reply) => {
        try {

        } catch (error) {
            console.log(error);
            return reply.status(500).send(error.message)
        }
    });

    fastify.post("/add-review", async (req, reply) => {
        const { body: review } = req;

        if (review?.images?.length) {
            review.images = await fileService.upload(review.images)
        }

        try {            
            // Mahsulot mavjudligini tekshirish
            const product = await shopProductModel.findById(review.product_id);
            if (!product) {
                throw new Error("Mahsulot topilmadi");
            }
    
            // Foydalanuvchi ushbu mahsulotga allaqachon sharh qoldirganligini tekshirish
            // const existingReview = await reviewModel.findOne({ product_id: review.product_id, user_id:review.user_id });
            // if (existingReview) {
            //     throw new Error("Siz ushbu mahsulotga allaqachon sharh qoldirgansiz.");
            // }
    
            // Yangi sharh yaratish
            const nevReview = new reviewModel(review);
            await nevReview.save();
    
            // Hammasi mahsulot sharhlarini olish va o'rtacha reytingni hisoblash
            const reviews = await reviewModel.find({ product_id: review.product_id });
            const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
            const averageRating = (totalRating / reviews.length).toFixed(1); // O'rtacha reytingni hisoblash
            const rating = Math.min(Math.max(averageRating, 0), 5); // 0 va 5 oralig'ida cheklash
    
            // Mahsulot reytingini yangilash
            await shopProductModel.updateOne(
                { _id: review.product_id },
                { $set: { rating, reviewsCount: reviews.length } }
            );
            
            return reply.send({
                message: "Sharh muvaffaqiyatli qo'shildi!",
                data: nevReview
            });
        } catch (error) {
            if (review?.images?.length) {
                await fileService.remove(review?.images)
            }
            console.error("Sharh qo'shishda xatolik yuz berdi:", error.message);
            reply.status(500).send({ error: "Sharh qo'shishda xatolik yuz berdi." });
        }
    });
    
}


module.exports = reviewRoutes;