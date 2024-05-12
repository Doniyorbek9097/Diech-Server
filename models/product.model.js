const {Schema, model } = require("mongoose");

const reviewSchema = Schema(
    {
      name: { type: String, required: true },
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
      user: {
       type: Schema.Types.ObjectId,
       ref: 'User',
       required: true,
        },
     },
    {
      timestamps: true,
    }
  )

  const colorSchema = Schema({
    color: {
        type: Schema.Types.ObjectId,
        ref:"Color"
    },
    price:Number,
    quantity: Number,
    images: {
        type:Array,
        default: []
    }
})


const sizeSchema = Schema({
    size: String,
    price: Number,
    quantity: Number
})

const memorySchema = Schema({
    memory: String,
    price: Number,
    quantity: Number,
})

const propertiesSchema = Schema({
    key: {
        type: String,
        intl: true
    },
    value: {
        type: String,
        intl: true
    }
},

{
    toJSON: { virtuals: true}
}

);



const productSchema = Schema({
    name: {
        type: String,
        intl: true
    },

    slug: {
        type:String,
        required:true
    },

    discription: {
        type: String,
        intl: true
    },

    properteis: [propertiesSchema],

    countInStock: {
        type: Number,
        min: 1    
    },

    orginal_price: {
        type:Number,
        required:true
    },

    sale_price: {
        type: Number,
        required: true
    },


    quantity: {
        type:Number,
        default:0
    },

    active: {
        type: Boolean,
        default: false
    },

  
    colors: {
        type: [colorSchema],
        default: []
    },

    sizes: {
        type:[sizeSchema],
        default: []
    },

    memories: {
        type:[memorySchema],
        default: []
    },
   
    images: {
        type:Array,
        default:[]
    },
    
    

    parentCategory: {
        type: Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },

    subCategory: {
        type: Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },

    childCategory: {
        type: Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },

    country: {
        type:String,
        default:""
    },

    brend: {
        type: Schema.Types.ObjectId,
        ref: "Brend"
    },

    shop: {
        type: Schema.Types.ObjectId,
        ref: "Shop"
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref:"User"

    },

    reviews: {
        type:[reviewSchema]
    },

    views:{
        type: [Schema.Types.ObjectId],
        ref: "User"
    },

    viewsCount: {
        type: Number,
        default: 0
    },

    soldOut: {
        orders: {
            type: Array,
            default: []
        },

        count: {
            type: Number,
            default: 0
        }
    },


    returned: {
        orders: {
            type: Array,
            default: []
        },

        count: {
            type: Number,
            default: 0
        }
    },

    rating: {
        type: Number,
        required: true,
        default: 0,
      },
     
    discount: {
        type: Number
    },

    
    type: {
        type: String,
        enum:["product"],
        default:"product"
    }
}, 

{ 
  timestamps:true,
  toJSON: { virtuals: true }
}

);


productSchema.pre("save", async function(next) {
    this.discount = parseInt(((this.orginal_price - this.sale_price) / this.orginal_price) * 100); 
})


const productModel = model("Product", productSchema); 
module.exports = {
    productModel,
}
