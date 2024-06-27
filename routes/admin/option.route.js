const router = require("express").Router()
const { optionModel, optionValuesModel } = require("../../models/productOpion.model")


router.get("/option-all", async (req, res) => {
    try {
        const options = await optionModel.find().populate("options")
        return res.json({
            message: "success",
            data: options
        })
    } catch (error) {
        console.log(error)
    }
})


router.post("/option-add", async (req, res) => {
    try {
        console.log(req.body);
        const option = await new optionModel(req.body).save();
        return res.json({
            message: "success",
            data: option
        })
    } catch (error) {
        console.log(error)
    }
})

router.post("/add-option-values", async (req, res) => {
    try {
        const { optionValues, deleteValues } = req.body;
        console.log(optionValues);
        for (const val of optionValues) {
            await optionValuesModel.updateOne(
                { 'label.uz': val?.label.uz, 'label.ru': val?.label.ru }, // Yangi ma'lumot qo'shish uchun name ni ishlatish
                { $set: val }, // Ma'lumotni yangilash
                { upsert: true } // Upsert rejimini ishlatish
            )
        }

        const result = await optionValuesModel.deleteMany({
            _id: { $in: deleteValues }
        });

        return res.json({data: true, message: "Success" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error occurred",
            error: error.message
        });
    }
});


router.get("/option-one/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const option = await optionModel.findById(id).populate("options")
        option.options = option.options.map(item => item.toObject())
        return res.json({
            message: "success",
            data: option
        })
    } catch (error) {
        console.log(error)
    }
})



router.delete("/option-delete/:id", async (req, res) => {
    try {
        const deleted = await optionModel.findByIdAndDelete(req.params.id)
        res.json({
            data: deleted,
            message: "succes deleted"
        })
    } catch (error) {
        console.log(error)
    }
})


module.exports = router