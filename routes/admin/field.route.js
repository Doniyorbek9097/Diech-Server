const router = require("express").Router()
const fieldModel = require("../../models/field.model")
const categoryModel = require("../../models/category.model")
router.post('/add-field', async (req, res) => {
    try {
        const newField = await new fieldModel(req.body).save()
        res.json({
            data: newField,
            message: "success added"
        })
    } catch (error) {
        console.log(error)
    }
})


router.get('/get-fields', async (req, res) => {
    try {
        const fields = await fieldModel.find()
        res.json(fields)
    } catch (error) {
        console.log(error)
    }
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