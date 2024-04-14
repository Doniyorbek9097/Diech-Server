const mongooose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt  = require("bcrypt");

const userSchema = new mongooose.Schema({
    firstname: {
        type:String,
    },
    lastname: {
        type:String,
    },

    avatar: {
        type:String
    },

    username: {
        type: String,
    },

    gender: {
        type: String,
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
        unique: true,
        index: true,
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
        default: "user",
        enum: ["user", "saller", "admin"]
    },

    address: {
        type: mongooose.Schema.Types.ObjectId,
        ref:"Address"
    }
},

    {
        timestamps: true,
        toJSON: { virtuals: true }
    }

);




userSchema.pre("save", async function(next) {
    if(this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt)
    }

    if(this.firstname && this.lastname) {
        this.username = `${this.firstname}`;
    }
});


userSchema.methods.comparePassword = async function(password) {
   return await bcrypt.compare(password, this.password)
}



userSchema.virtual("shops", {
    "ref": "Shop",
    localField: "_id",
    foreignField: "owner"
});


userSchema.virtual("orders", {
    ref: "Order",
    localField: "_id",
    foreignField: "user"
})


// userSchema.index( 
//     { created_at: 1 },
//     { expireAfterSeconds: "1d", partialFilterExpression: { verified: false } }
// )



module.exports = mongooose.model("User", userSchema);