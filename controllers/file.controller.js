const fileModel = require("../models/file.model")
const fileService = require("../services/file.service2")

class File {
    async imageUpload(req, reply, fileOptions = {}) {
        try {
            const part = await req.file();
            const image_url = await fileService.photoUpload({ part, ...fileOptions })
            const newdata = await new fileModel({ image_url }).save()
            return reply.send(newdata.image_url)

        } catch (error) {
            console.log(error);
            reply.code(500).send(error.message)

        }
    }

    async imageRemove(req, reply) {
        try {
            const { image_url } = req.params;
            const file = await fileModel.findOne({ image_url });
            await fileService.remove(file?.image_url)
            const deleted = await fileModel.findByIdAndDelete(file?._id);
            return reply.send(deleted)
        } catch (error) {
            console.log(error);
            reply.code(500).send(error.message)

        }
    }
}

module.exports = new File();