const fieldController = require("../../controllers/admin/field.controller")

const fieldRoutes = (fastify, options) => {

    fastify.post('/add-field', fieldController.create)

    fastify.get('/get-fields', fieldController.all)

    fastify.get('/get-field/:id', fieldController.oneById)

    fastify.put('/edit-field/:id', fieldController.updateById)

    fastify.delete('/delete-field/:id', fieldController.deleteById)

}

module.exports = fieldRoutes;