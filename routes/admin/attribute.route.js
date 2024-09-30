const Attributes = require("../../models/attributes.model");

const attributeRoutes = async (fastify, options) => {
    fastify.post("/attribute-add", async (req, reply) => {
        try {
            const attributes = req.body;

            const savedAttribute = await Attributes.insertMany(attributes); // Bir nechta atributlarni qo'shish
            return reply.code(201).send(savedAttribute); // 201: Yaratilgan
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: 'Something went wrong', details: error.message }); // 500: Server xatosi
        }
    });


    fastify.get("/attributes", async (req, reply) => {
        try {
            const attributes = await Attributes.find(); 
            return reply.code(200).send(attributes); 

        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: 'Something went wrong', details: error.message }); // 500: Server xatosi
        }
    });

    fastify.get("/attribute/:id", async (req, reply) => {
        try {
            const { id } = req.params;
            const attributes = await Attributes.findById(id).lean(); 
            return reply.code(200).send(attributes); 
            
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: 'Something went wrong', details: error.message }); // 500: Server xatosi
        }
    });

    fastify.put("/attribute/:id", async (req, reply) => {
        try {
            const attributeBody = req.body;
            const { id } = req.params;
            const updatedAttribute = await Attributes.findByIdAndUpdate(id, attributeBody); 
            return reply.code(200).send(updatedAttribute); 
            
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: 'Something went wrong', details: error.message }); // 500: Server xatosi
        }
    });

    fastify.delete("/attribute/:id", async (req, reply) => {
        try {
            const { id } = req.params;
            const deletedAttribute = await Attributes.findByIdAndDelete(id); 
            return reply.code(200).send(deletedAttribute); 
            
        } catch (error) {
            console.error(error);
            return reply.code(500).send({ error: 'Something went wrong', details: error.message }); // 500: Server xatosi
        }
    });
}


module.exports = attributeRoutes;