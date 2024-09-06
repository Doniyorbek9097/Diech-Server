const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt  = require("bcrypt");
const {  generateOTP } = require("../utils/otpGenrater");
const slugify = require("slugify")
const { serverDB } = require("../config/db")

const telegamSchema = mongoose.Schema({
    id: String,
    username:String,
    fisrt_name:String,
    last_name: String,
    is_bot: Boolean,
    language_code:String

})


const userSchema = new mongoose.Schema({
    telegramAccount: telegamSchema,
    firstname: {
        type:String,
    },
    lastname: {
        type:String,
    },

    
    fathername: {
        type:String,
    },

    avatar: {
        type:String,
        default:"https://ps.w.org/user-avatar-reloaded/assets/icon-256x256.png"
    },

    username: {
        type: String,
    },

    gender: {
        type: String,
        enum:['Erkak',"Ayol"]
    },

    birthday: {
        type:String,
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
        type: mongoose.Schema.Types.ObjectId,
        ref:"Address"
    },

    shop: {
        type: mongoose.Schema.Types.ObjectId,
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


userSchema.pre("save", function(next) {
    if(this.firstname && this.phone_number) {
        this.username = slugify(`${this.firstname}_${this.phone_number.split(" ").join("").slice(-4)}`)
    } else {
        this.username = slugify(`${this.phone_number}`)
    }

    next()
})



userSchema.index( 
    { created_at: 1 },
    { expireAfterSeconds: "1d", partialFilterExpression: { verified: false } }
)

const userModel = serverDB.model("User", userSchema);


module.exports = userModel;



