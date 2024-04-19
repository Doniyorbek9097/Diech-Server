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

    sold: {
        type:Number,
        default:0
    },

    colors: [
        {
           name: String,
           code: String,
           images: Array
        }
    ],

    size: {
        type: String,
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

    rating: {
        type: Number,
        required: true,
        default: 0,
      },
     
    discount: {
        type: Number
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
