const router = require("express").Router()
const fieldModel = require("../../models/field.model")

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
        const field = await fieldModel.findByIdAndDelete(req.params.id)
        res.json(field)
    } catch (error) {
        console.log(error)
    }
})


module.exports = router