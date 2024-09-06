const pointModel = require("../../models/point.model");

const pointRoutes = async(fastify, options) => {
try {
    
// POST /point-add
fastify.post('/point-add', async (req, reply) => {
    try {
        const newPoint = await new pointModel(req.body).save();
        return reply.send({
            message: 'success',
            data: newPoint,
        });
    } catch (error) {
        console.log(error.message);
        return reply.status(500).send(error.message);
    }
});

// GET /point-all
fastify.get('/point-all', async (req, reply) => {
    try {
        const points = await pointModel.find();
        return  reply.send({
            message: 'success',
            data: points,
        });
    } catch (error) {
        console.log(error);
        return  reply.status(500).send(error.message);
    }
});

// GET /point-delete/:id
fastify.delete('/point-delete/:id', async (req, reply) => {
    try {
        const { id } = req.params;
        const deleted = await pointModel.findByIdAndDelete(id);
        reply.send({
            message: 'success',
            data: deleted,
        });
    } catch (error) {
        console.log(error);
        reply.status(500).send(error.message);
    }
});
} catch (error) {
   console.log(error); 
}

}

module.exports = pointRoutes;