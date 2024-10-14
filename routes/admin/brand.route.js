const slugify = require("slugify");
const brendModel = require("../../models/brand.model");
const fileModel = require("../../models/file.model")
const fileService = require("../../services/file.service2")

const brendRoutes = async (fastify, options) => {

    // GET /brends
    fastify.get('/brands', async (req, reply) => {
        try {
            let brends = await brendModel.find().populate('products');
            return reply.status(200).send(brends);
        } catch (error) {
            console.log(error);
            return reply.status(500).send(`server xatosi: ${error.message}`);
        }
    });

    // POST /brend
    fastify.post('/brand', async (req, reply) => {
        req.body.slug = slugify(req.body.name);

        try {
            const existsBrend = await brendModel.findOne({ slug: req.body.slug });
            if (existsBrend) {
                return reply.send({
                    message: "Bunday Brend Mavjud!"
                });
            }

            const newBrend = await new brendModel(req.body).save();
            const { icon, image, _id: brend_id } = req.body;
            if(newBrend) {
                if (icon) {
                    await fileModel.updateOne({ image_url: icon }, { isActive: true, owner_id: brend_id, owner_type: "brand" });
                }
    
                if (image?.uz) {
                    await fileModel.updateOne({ image_url: image.uz }, { isActive: true, owner_id: brend_id, owner_type: "brand" });
                }
    
                if (image?.ru) {
                    await fileModel.updateOne({ image_url: image.ru }, { isActive: true, owner_id: brend_id, owner_type: "brand" });
                }
            }
           

            return reply.status(201).send(newBrend);
        } catch (error) {
            console.log(error);
            return reply.status(500).send(error.message);
        }
    });

    // GET /brend-slug/:slug
    fastify.get('/brand-slug/:slug', async (req, reply) => {
        try {
            const { slug } = req.params;
            let brend = await brendModel.findOne({ slug })
                .populate('categories', 'name image slug')
                .populate('products')
                .populate('carousel', 'image slug');
            return reply.status(200).send(brend);
        } catch (error) {
            console.log(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // GET /brend/:id
    fastify.get('/brand/:id', async (req, reply) => {
        try {
            const { id } = req.params;
            let brend = await brendModel.findOne({ _id: id });
            return reply.status(200).send(brend.toObject());
        } catch (error) {
            console.log(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // PUT /brend/:id
    fastify.put('/brand/:id', async (req, reply) => {
        const { id } = req.params;
        req.body.slug = slugify(req.body.name);
        try {
            const newBrend = await brendModel.findOneAndUpdate({ _id: id }, req.body, {new: true}).lean();
            const { icon, image, _id: brend_id } = newBrend;
            if (icon) {
                await fileModel.updateOne({ image_url: icon }, { isActive: true, owner_id: brend_id, owner_type: "brand" });
            }

            if (image?.uz) {
                await fileModel.updateOne({ image_url: image.uz }, { isActive: true, owner_id: brend_id, owner_type: "brand" });
            }

            if (image?.ru) {
                await fileModel.updateOne({ image_url: image.ru }, { isActive: true, owner_id: brend_id, owner_type: "brand" });
            }
            return reply.status(200).send(newBrend.toObject());
        } catch (error) {
            console.log(error);
            return reply.status(500).send("Serverda Xatolik");
        }
    });

    // DELETE /brend/:id
    fastify.delete('/brand/:id', async (req, reply) => {
        try {
            const deleteBrend = await brendModel.findByIdAndDelete(req.params.id).lean()
        
            if (!deleteBrend) {
                return reply.status(404).send("Brand topilmadi");
            }
    
            const { logo, image } = deleteBrend;
    
            if (logo) {
                try {
                    await fileService.remove(logo);
                    await fileModel.deleteOne({ image_url: logo });
                } catch (fileError) {
                    console.error("Ikonni o'chirishda xato:", fileError);
                }
            }
            
            if (image?.uz) {
                try {
                    await fileService.remove(image.uz);
                    await fileModel.deleteOne({ image_url: image.uz });
                } catch (fileError) {
                    console.error("Uz rasmni o'chirishda xato:", fileError);
                }
            }
    
            if (image?.ru) {
                try {
                    await fileService.remove(image.ru);
                    await fileModel.deleteOne({ image_url: image.ru });
                } catch (fileError) {
                    console.error("Ru rasmni o'chirishda xato:", fileError);
                }
            }
    
            return reply.code(200).send("Muvaffaqiyatli o'chirildi!");
        } catch (error) {
            console.error(error);
            return reply.code(500).send("Server xatosi: " + error.message);
        }
    });
    

    fastify.post("/brand-image-upload", async(req, reply) => {
        try {
            const part = await req.file();
            const image_url = await fileService.photoUpload({ part })
            const newdata = await new fileModel({ image_url }).save()
            return reply.send(newdata.image_url)

        } catch (error) {
            console.log(error);
            reply.code(500).send(error.message)

        }
    })
        fastify.delete("/brand-image-remove/:image_url", async(req, reply) => {
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
        })

}


module.exports = brendRoutes;