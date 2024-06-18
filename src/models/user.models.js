import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true
    },
    email:{
        type: String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
    },
    fullname:{
        type: String,
        required:true,
        unique:true,
        trim:true,
    },
    avatar:{
        type: String,
        required:true,
    },
    coverimage:{
        type:String
    },
    watchHistory:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Video",
    },
    password:{
        type:String,
        required:[true,"password is required"]
    },
    refreshToken:{
        type:String
    }
},{timestamps:true});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password=bcryptjs.hash(this.password,7);
    next();
})

userSchema.methods.isPassCorrect=async function(pass){
    return await bcryptjs.compare(pass,this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id:this._id,
        username:this.username,
        email:this.email,
        fullname:this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}
export const User = mongoose.model("User",userSchema);