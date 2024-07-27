const router = require("express").Router();
const categoryModel = require("../../models/category.model");


// Get prent all category
router.get("/category-all", async (req, res) => {
    try {

        let categories = await categoryModel.find({ parent: undefined })
            .populate({
                path: "parent",
                populate: {
                    path: "parent"
                }
            })


        return res.status(200).json({
            // totalPage: Math.ceil(products.length / limit),
            // page: page + 1,
            // limit,
            categories,
            // products,
        });

    } catch (err) {
        console.log(err)
        res.status(500).json("server ishlamayapti")
    }
});


router.get("/category-one/:id", async (req,res) => {
    const { id } = req.params;
    let category = await categoryModel.findById(id)
    .populate({
        path:"products",
        populate: {
            path:"brend"
        }
    })
    
    return res.json(category)
})


module.exports = router;