const slugify = require("slugify");
const mongoose = require("mongoose");
const categoryModel = require("../../models/category.model");
const { generateOTP } = require("../../utils/otpGenrater")
const fileService = require("../../services/file.service2")
const fileModel = require("../../models/file.model")
const conn = mongoose.connection;
// let gfs;

// conn.on("open", () => {

// })
class Category {
    async create(req, reply) {
        try {
            const formData = req.body;
            for (const cate of formData) {
                cate.slug = slugify(`${cate.name.ru.toLowerCase()}-${generateOTP(5)}`)
            }

            const newCategory = await categoryModel.insertMany(formData);
            return reply.send({
                data: newCategory,
                message: "Success"
            })
        } catch (error) {
            console.log(error)
            return reply.status(500).send(error.message)

        }

    }


    async getAll(req, reply) {
        try {
            const search = req.query.search || "";
            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 100;

            let query = { parent: undefined };

            if (search) {
                const regex = new RegExp(search, 'i');
                query.$or = [
                    { 'name.uz': regex },
                    { 'name.ru': regex }
                ]
            }

            const totalDocuments = await categoryModel.countDocuments(query).exec()
            const totalPages = Math.ceil(totalDocuments / limit);

            let categories = await categoryModel.find(query)
                .populate("children")
                .populate("fields")
                .populate('banners')
                .populate('image')
                .skip(page * limit)
                .limit(limit)
                .sort({ _id: -1 })

            return reply.send({
                message: "success get products",
                data: categories,
                limit,
                page,
                totalPages
            });

        } catch (error) {
            console.log(error)
            return reply.status(500).send(error.message)
        }
    }

    async getAllByParentId(req, reply) {
        try {
            const { id } = req.params;
            const search = req.query.search || "";
            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 2;

            let query = { parent: id };

            if (search) {
                const regex = new RegExp(search, 'i');
                query.$or = [
                    { 'name.uz': regex },
                    { 'name.ru': regex }
                ]
            }

            const totalDocuments = await categoryModel.countDocuments(query).exec()
            const totalPages = Math.ceil(totalDocuments / limit);

            let categories = await categoryModel.find(query)
                .populate('banners')
                .populate('image')
                .populate({
                    path: "children",
                    populate: [
                        {
                            path: "image"
                        },
                        {
                            path: "banners"
                        },
                    ]
                })
                .populate({
                    path: "fields",
                })
                .skip(page * limit)
                .limit(limit)
                .sort({ _id: -1 })

            return reply.send({
                message: "success get products",
                data: categories,
                limit,
                page,
                totalPages
            });

        } catch (error) {
            console.log(error)
            return reply.status(500).send(error.message)
        }
    }

    async oneById(req, reply) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return reply.status(404).send("Category Id haqiqiy emas");
            }

            let category = await categoryModel.findById(req.params.id).lean()
                .populate({
                    path: "children",
                })

            if (!category) return reply.status(404).send("Category topilmadi");
            return reply.status(200).send(category);

        } catch (error) {
            console.log(error)
            return reply.status(500).send(error.message)
        }
    }


    async oneBySlug(req, reply) {
        try {
            const { slug } = req.params
            let category = await categoryModel.findOne({ slug })
                .populate("children")
                .populate('fields')

            if (!category) return reply.status(404).send("Category topilmadi");
            return reply.status(200).send(category);

        } catch (error) {
            console.log(error)
            return reply.status(500).send(error.message)
        }
    }


    async updateById(req, reply) {
        const { body: category } = req;
        const { id } = req.params;
        try {
            const upadted = (await categoryModel.findByIdAndUpdate(id, category, {new: true})).toObject();
            if(upadted.icon) {
               await fileModel.updateOne({image_url: upadted.icon}, {isActive: true})
            }

            if(upadted.image) {
                await fileModel.updateOne({image_url: upadted.image}, {isActive: true})
             }

            return reply.status(200).send(upadted);

        } catch (error) {
            return reply.status(500).send(error.message)
        }
    }


    async updateField(req, reply) {
        try {
            const { body: category } = req;
            await categoryModel.updateOne({ _id: category._id }, { $set: { showHomePage: category.showHomePage } })
            return reply.send("Success updated")

        } catch (error) {
            console.log(error);
            return reply.send(error.message)
        }
    }


    async deleteById(req, reply) {
        try {

            let deleted = await categoryModel.findByIdAndDelete(req.params.id).lean();
            if (!deleted) return reply.status(404).send("Category not found");

            if (deleted?.icon) {
                await fileService.remove(deleted?.icon);
                await fileModel.findOneAndDelete({ image_url: deleted?.icon });
            }

            if (deleted?.image) {
                await fileService.remove(deleted?.image);
                await fileModel.findOneAndDelete({ image_url: deleted?.image });
            }

            return reply.status(200).send(deleted);

        } catch (error) {
            console.log(error);
            return reply.status(500).send("category o'chirib bo'lmadi")
        }
    }


    async imageUpload(req, reply) {
        try {
            const part = await req.file();
            const image_url = await fileService.photoUpload({ part })
            const newdata = await new fileModel({ image_url }).save()
            return reply.send(newdata.image_url)

        } catch (error) {
            console.log(error);
            reply.code(500).send(error.message)

        }
    }


}



module.exports = new Category();