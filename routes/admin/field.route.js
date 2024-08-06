const router = require("express").Router()
const fieldController = require("../../controllers/admin/field.controller")

router.post('/add-field', fieldController.create)

router.get('/get-fields', fieldController.all)

router.get('/get-field/:id', fieldController.oneById)

router.put('/edit-field/:id', fieldController.updateById)

router.delete('/delete-field/:id', fieldController.deleteById)



module.exports = router