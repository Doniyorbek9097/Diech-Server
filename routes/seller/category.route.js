const router = require("express").Router();
const categoryModel = require("../../models/category.model");


// Get prent all category
router.get("/category-all", async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
        const limit = parseInt(req.query.limit, 10) || 100;
        
        let query = {parent: undefined};

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or =  [
                { 'name.uz': regex },
                { 'name.ru': regex }
            ]
        }

        const totalDocuments = await categoryModel.countDocuments(query).exec()
        const totalPages = Math.ceil(totalDocuments / limit);

        let categories = await categoryModel.find(query)
            .populate("children")
            .populate("fields")
            .populate('banners')
            .populate('image')
            .skip(page * limit)
            .limit(limit)
            .sort({ _id: -1 })

            return res.json({
                message: "success get products",
                data: categories,
                limit,
                page,
                totalPages
            });

    } catch (error) {
        console.log(error)
        res.status(500).json(error.message)
    }
});


router.get("/category-slug/:slug", async (req, res) => {
    try {
        const { slug } = req.params
        let category = await categoryModel.findOne({ slug })
            .populate("children")
            .populate('fields')

        if (!category) return res.status(404).send("Category topilmadi");
        return res.status(200).json(category);

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
})


module.exports = router;