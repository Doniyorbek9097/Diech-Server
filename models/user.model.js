const mongooose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt  = require("bcrypt");


const addressSchema = mongooose.Schema({

})

const telegamSchema = mongooose.Schema({
    id: String,
    username:String,
    fisrt_name:String,
    last_name: String,
    is_bot: Boolean,
    language_code:String

})


const userSchema = new mongooose.Schema({
    telegramAccount: telegamSchema,
    firstname: {
        type:String,
        default:""
    },
    lastname: {
        type:String,
        default:""
    },

    
    fathername: {
        type:String,
        default:""
    },

    avatar: {
        type:String,
        default:"https://ps.w.org/user-avatar-reloaded/assets/icon-256x256.png"
    },

    username: {
        type: String,
        unique: true,
    },

    gender: {
        type: String,
        enum:['Erkak',"Ayol"]
    },

    birthday: {
        type:String,
        default:""
    },

    phone_number: {
        type:String,
        required:true
    },
    password: {
        type:String,
    },

    email: {
        type: String,
        lowarcase: true
    },

    isBlocked: {
        type: Boolean,
        default: false
    },

    verified: {
            type:Boolean,
            default:false
    },

    role: {
        type: String,
        enum: ["user","deliverer", "seller", "admin", "creator"],
        default: "user"
    },

    sellerRole: {
        type:String,
        enum:["director","manager","deliverer"],
    },

    address: {
        type: mongooose.Schema.Types.ObjectId,
        ref:"Address"
    },

    shop: {
        type: mongooose.Schema.Types.ObjectId,
        ref:"Shop"
    }
},

    {
        timestamps: true,
        toJSON: { virtuals: true }
    }

);



userSchema.methods.comparePassword = async function(password) {
   return await bcrypt.compare(password, this.password)
}


userSchema.virtual("orders", {
    ref: "Order",
    localField: "_id",
    foreignField: "user"
})


userSchema.virtual("saller-orders", {
    ref: "Order",
    localField: "_id",
    foreignField: "seller"
})



userSchema.index( 
    { created_at: 1 },
    { expireAfterSeconds: "1d", partialFilterExpression: { verified: false } }
)


const userModel = mongooose.model("User", userSchema);
module.exports = userModel