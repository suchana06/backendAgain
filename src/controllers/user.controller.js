import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
const registerUser = asyncHandler(async (req, res) => {
    const { username, fullname, password, email } = req.body;
    //console.log(username, email);
    if ([username, fullname, password, email].some((f) => {
        f?.trim() === "";
    })) {
        res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        res.status(400).json({
            success: false,
            message: "User already exists"
        })
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverimageLocalPath = req.files?.coverimage[0]?.path;
    if(!avatarLocalPath){
        res.status(400).json({
            success: false,
            message: "Avatar is required"
        })
    }
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverimage= await uploadOnCloudinary(coverimageLocalPath)
    if(!avatar){
        res.status(400).json({
            success: false,
            message: "Avatar is required"
        })
    }
    const user=await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        res.status(400).json({
            success: false,
            message: "Something went wrong"
        })
    }
    return res.status(201).json({
        success: true,
        data: createdUser
    })
})


export { registerUser };