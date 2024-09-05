const fieldModel = require("../../models/field.model")
const categoryModel = require("../../models/category.model")

class Field {
    async create(req, reply) {
        try {
            const newField = await new fieldModel(req.body).save();
           return reply.send({
                data: newField,
                message: "success added"
            });
        } catch (error) {
            console.log(error);
            return reply.status(500).send({ message: "Error creating field", error: error.message });
        }
    }

    async all(req, reply) {
        try {
            const fields = await fieldModel.find();
            return reply.send(fields);
        } catch (error) {
            console.log(error);
            return reply.status(500).send({ message: "Error retrieving fields", error: error.message });
        }
    }

    async oneById(req, reply) {
        try {
            const field = await fieldModel.findById(req.params.id).lean();
            if (!field) {
                return reply.status(404).send({ message: "Field not found" });
            }
            return reply.send(field);
        } catch (error) {
            console.log(error);
            return reply.status(500).send({ message: "Error retrieving field", error: error.message });
        }
    }

    async updateById(req, reply) {
        try {
            const field = await fieldModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!field) {
                return reply.status(404).send({ message: "Field not found" });
            }
            return reply.send(field);
        } catch (error) {
            console.log(error);
            return reply.status(500).send({ message: "Error updating field", error: error.message });
        }
    }

    async deleteById(req, reply) {
        try {
            const deleted = await fieldModel.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return reply.status(404).send({ message: "Field not found" });
            }
            await categoryModel.updateMany(
                { fields: req.params.id },
                { $pull: { fields: req.params.id } }
            );
            reply.send(deleted);
        } catch (error) {
            console.log(error);
            return  reply.status(500).send({ message: "Error deleting field", error: error.message });
        }
    }
}

module.exports = new Field();
