const slugify = require("slugify");
const mongoose = require("mongoose");
const categoryModel = require("../../models/category.model");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { redisClient } = require("../../config/redisDB");
const { generateOTP } = require("../../utils/otpGenrater")
const path = require("path");
const fs = require("fs");


class Category {
    async create(req, res) {
        try {
            redisClient.FLUSHALL()
            const formData = req.body;

            for (const cate of formData) {
                cate.slug = slugify(`${cate.name.ru.toLowerCase()}-${generateOTP(5)}`)
            }

            const newCategory = await categoryModel.insertMany(formData);
            return res.json({
                data: newCategory,
                message: "Success"
            })
        } catch (error) {
            console.log(error)
            res.status(500).json(error.message)
        }
    }


    async getAll(req, res) {
        try {
            const search = req.query.search || "";
            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 100;
            
            let query = {parent: undefined};

            if (search) {
                const regex = new RegExp(search, 'i');
                query.$or =  [
                    { 'name.uz': regex },
                    { 'name.ru': regex }
                ]
            }
    
            const totalDocuments = await categoryModel.countDocuments(query).exec()
            const totalPages = Math.ceil(totalDocuments / limit);

            let categories = await categoryModel.find(query)
                .populate({
                    path: "children",
                })
                .populate({
                    path: "fields",
                })
                .skip(page * limit)
                .limit(limit)
                .sort({ _id: 1 })

                return res.json({
                    message: "success get products",
                    data: categories,
                    limit,
                    page,
                    totalPages
                });

        } catch (error) {
            console.log(error)
            res.status(500).json(error.message)
        }
    }

    async getAllByParentId(req, res) {
        try {
            const { id } = req.params;
            const search = req.query.search || "";
            const page = Math.max(0, parseInt(req.query.page, 10) - 1 || 0);
            const limit = parseInt(req.query.limit, 10) || 2;
            
            let query = {parent: id};

            if (search) {
                const regex = new RegExp(search, 'i');
                query.$or =  [
                    { 'name.uz': regex },
                    { 'name.ru': regex }
                ]
            }
    
            const totalDocuments = await categoryModel.countDocuments(query).exec()
            const totalPages = Math.ceil(totalDocuments / limit);

            let categories = await categoryModel.find(query)
                .populate({
                    path: "children",
                })
                .populate({
                    path: "fields",
                })
                .skip(page * limit)
                .limit(limit)
                .sort({ _id: -1 })

                return res.json({
                    message: "success get products",
                    data: categories,
                    limit,
                    page,
                    totalPages
                });

        } catch (error) {
            console.log(error)
            res.status(500).json(error.message)
        }
    }

    async oneById(req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(404).send("Category Id haqiqiy emas");
            }

            let category = await categoryModel.findById(req.params.id)
                .populate({
                    path: "children",
                })

            if (!category) return res.status(404).send("Category topilmadi");
            return res.status(200).json(category.toObject());

        } catch (error) {
            console.log(error)
            res.status(500).send(error.message)
        }
    }


    async oneBySlug(req, res) {
        try {
            const { slug } = req.params
            let category = await categoryModel.findOne({ slug })
                .populate("children")
                .populate('fields')

            if (!category) return res.status(404).send("Category topilmadi");
            return res.status(200).json(category);

        } catch (error) {
            console.log(error)
            res.status(500).send(error.message)
        }
    }


    async updateById(req, res) {
        redisClient.FLUSHALL()
        req.body.slug = slugify(`${req.body.name.ru.toLowerCase()}-${generateOTP(5)}`)



        try {
            const upadted = await categoryModel.findByIdAndUpdate(req.params.id, req.body);
            return res.status(200).json(upadted);

        } catch (error) {

            if (req.body.image) {
                const imagePath = path.join(__dirname, `../../uploads/${path.basename(req.body.image)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }

            if (req.body.icon) {
                const imagePath = path.join(__dirname, `../../uploads/${path.basename(req.body.icon)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }

            return res.status(500).json(error.message)
        }
    }


    async deleteById(req, res) {
        try {
            redisClient.FLUSHALL()

            let deleted = await categoryModel.findByIdAndDelete(req.params.id);
            if (!deleted) return res.status(404).json("Category not found");
           
            if (deleted?.image) {
                const imagePath = path.join(__dirname, `../../uploads/${path.basename(deleted.image)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }

            if (deleted?.icon) {
                const imagePath = path.join(__dirname, `../../uploads/${path.basename(deleted.icon)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }


            res.status(200).json(deleted);

        } catch (error) {
            console.log(error);
            res.status(500).json("category o'chirib bo'lmadi")
        }
    }

}



module.exports = new Category();