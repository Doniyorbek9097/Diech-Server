const fieldController = require("../../controllers/admin/field.controller")
const { checkToken } = require("../../middlewares/authMiddleware")



const FieldRoutes = async (fastify, options) => {
    try {
        fastify.post('/add-field', { preHandler: checkToken }, fieldController.create)

        fastify.get('/get-fields', fieldController.all)

        fastify.get('/get-field/:id', { preHandler: checkToken }, fieldController.oneById)

        fastify.put('/edit-field/:id', { preHandler: checkToken }, fieldController.updateById)

        fastify.delete('/delete-field/:id', { preHandler: checkToken }, fieldController.deleteById)
    }
    catch (error) {
        console.log(error);
    }

}

module.exports = FieldRoutes;


