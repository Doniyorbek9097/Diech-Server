const slugify = require("slugify");
const shopModel = require("../../models/shop.model");

const shopRoutes = async (router, options) => {

    router.post("/shop", async(req,res) => {
        try {
            req.body.slug = slugify(req.body.slug);
            const result = await new shopModel(req.body).save();
            return  result;
        } catch (error) {
            console.log(error)
        }
    });
    

    router.get("/shops", async(req,res) => {
        try {
            const shops = await shopModel.find()
            .populate("employees")
            .populate("products")
            .populate("point")
    
            return {
                data: shops,
                message: "success"
            }

        } catch (error) {
            console.log(error)
            res.status(500).send(error.message)
        }
    });
    
    
    
    router.get("/shop/:slug", async(req,res) => {
        try {
            const result = await shopModel.findOne({slug:req.params.slug})
            .populate(
            {
                path:"products",
                populate: [
                    {
                        path:"product"
                    },
                    {
                        path:"shop"
                    }
                ]
            })
            
            return {
                data: result,
                message:"success"
            }

        } catch (error) {
            console.log(error);
            res.status(500).send(error.message)
        }
    });
    
    
    router.put("/shop/:id", async(req,res) => {
        try {
            req.body.slug = slugify(req.body.name);
            const result = await shopModel.findByIdAndUpdate(req.params.id, req.body);
            return {result, message:"success updated!"};
        } catch (error) {
            console.log(error)
        }
    });
    
    
    router.delete("/shop/:id", async(req,res)=> {
        try {
            const result = await shopModel.findByIdAndDelete(req.params.id);
            return {result, message:"success deleted!"};
        } catch (error) {
            console.log(error)
        }
    });
    
}


module.exports = shopRoutes;