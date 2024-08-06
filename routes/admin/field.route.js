const router = require("express").Router()
const fieldModel = require("../../models/field.model")
const categoryModel = require("../../models/category.model")

const fieldController = require("../../controllers/admin/field.controller")

router.post('/add-field', fieldController.create)


router.get('/get-fields', async (req, res) => {
    const fields = await fieldModel.find()
    for (const field of fields) {
        if(field?.category_id) {
            await categoryModel.updateMany({_id: field?.category_id}, {$push: {fields: field._id} } )
        }
    }

    res.send("success push")
})



router.get('/get-field-del', async (req, res) => {
    await fieldModel.updateMany({}, {$unset: {category_id: ""}})
    res.send("success del")
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