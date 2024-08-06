const router = require("express").Router()
const fieldModel = require("../../models/field.model")
const categoryModel = require("../../models/category.model")

const fieldController = require("../../controllers/admin/field.controller")

router.post('/add-field', fieldController.create)


router.get('/get-fields', async (req, res) => {
    const categories = await categoryModel.find().populate("fields")
    for (const cate of categories) {
        if(cate?.fields?.length) {
            for (const id of cate.fields) {
               await fieldModel.updateMany({_id: id}, {$set: {category_id: cate._id} } )
            }
        }
    }

    await categoryModel.updateMany({}, {$unset: {fields: ""}})


})



router.get('/get-field-del', async (req, res) => {
    
    await categoryModel.updateMany({}, {$unset: {fields: ""}})
    fieldModel.deleteMany({'label.uz':"Mahsulot tarkibi"})

})

router.get('/get-field/:id', async (req, res) => {
    try {
        const field = await fieldModel.findById(req.params.id).lean()
        res.json(field)
    } catch (error) {
        console.log(error)
    }
})

router.put('/edit-field/:id', async (req, res) => {
    try {
        const field = await fieldModel.findByIdAndUpdate(req.params.id, req.body)
        res.json(field)
    } catch (error) {
        console.log(error)
    }
})


router.delete('/delete-field/:id', async (req, res) => {
    try {
        const deleted = await fieldModel.findByIdAndDelete(req.params.id)
        if (!deleted) {
            return res.status(404).json({ message: 'Field not found' })
        }
        await categoryModel.updateMany(
            { fields: req.params.id },
            { $pull: { fields: req.params.id } }
        )
        res.json(deleted)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' })
    }
})



module.exports = router