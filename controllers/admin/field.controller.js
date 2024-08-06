const fieldModel = require("../../models/field.model")

class Field {
    async create(req, res) {
        try {
            const newField = await new fieldModel(req.body).save()
            res.json({
                data: newField,
                message: "success added"
            })
        } catch (error) {
            console.log(error)
        }
    }
}


module.exports = new Field();