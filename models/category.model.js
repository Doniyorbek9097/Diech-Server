const { Schema, model, models } = require("mongoose");


const categorySchema = new Schema({
    name: {
        type: String,
        intl: true
    },
    slug: {
        type: String,
        unique: true
    },

    icon: String,
    image: String,

    left_banner: {
        image: {
            type: String,
            intl: true,
        },
        slug: {
            type: String
        }
    },

    top_banner: {
        image: {
            type: String,
            intl: true,
        },
        slug: {
            type: String
        }
    },


    parent: {
        ref: "Category",
        type: Schema.Types.ObjectId,
    },


    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    type: {
        type: String,
        enum: ["category"],
        default: "category"
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true }
    }

);


categorySchema.virtual("children", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent",
})

categorySchema.virtual("products", {
    ref: "Product",
    localField: "_id",
    foreignField: "categories",
})

categorySchema.virtual("shop_products", {
    ref: "ShopProducts",
    localField: "_id",
    foreignField: "categories",
})



// Rekursiv bolalar yuklash funksiyasi
async function populateChildren(doc) {
    try {
        await doc.populate('children')
        if (doc.children.length) {
            for (let child of doc.children) {
               await populateChildren(child);
            }
        }
    } catch (error) {
        console.error('Error in populateChildren:', error);
        throw error; // Xatoni qaytarib berish
    }
}

// Middleware
categorySchema.post(['find', 'findOne', 'findById'], async function(docs, next) {
    try {
        console.log(docs)
        if (Array.isArray(docs)) {
            for (let doc of docs) {
                await populateChildren(doc);
            }
        } else {
            await populateChildren(docs);
        }
        next(); // Keyingi middleware yoki operatsiyaga o'tish
    } catch (error) {
        console.error('Error in middleware:', error);
        next(error); // Xatoni next orqali yuborish
    }
});


const categoryModel = model("Category", categorySchema);

module.exports = {
    categoryModel
}