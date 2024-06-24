import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access token and refresh token")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    const { username, fullname, password, email } = req.body;
    //console.log(username, email);
    if ([username, fullname, password, email].some((f) => {
        f?.trim() === "";
    })) {
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(400, "User already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverimageLocalPath = req.files?.coverimage[0]?.path;

    let coverimageLocalPath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverimageLocalPath = req.files.coverimage[0].path;
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Missing avatar")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverimageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "avatar is required")
    }
    const user = await User.create({
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
    if (!createdUser) {
        throw new ApiError(400, "something went wrong")
    }
    return res.status(201).json({
        success: true,
        data: createdUser
    })
})
const loginUser = asyncHandler(async (req, res) => {
    //req body->data
    //username or email
    //find user
    //password check
    //access and refresh token
    //send cookie 
    const { username, email, password } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(400, "user not found")
    }
    const isPasswordValid = await user.isPassCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(400, "invalid password")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        ))

})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user successfully logged out"));

})
const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingToken = req.cookies.refreshToken || req.body.refreshToken
        if (!incomingToken) {
            throw new ApiError(401, "unauthorized")
        }
        const decodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "invalid token access")

        }
        if (incomingToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token expired")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(200, {
                accessToken,
                newrefreshToken
            }, "access token refreshed successfully")
    } catch (error) {
        throw new ApiError(401, error?.message)
    }
})
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id)
    const isPassCorrect = await user.isPassCorrect(oldPassword)
    if (!isPassCorrect) {
        throw new ApiError(401, "Invalid password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200)
        .json(new ApiResponse(200, {}, "password updated successfully"))
})
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(200, req.user, "current user fetched successfully")
})
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body;
    if (!email || !fullname) {
        throw new ApiError(400, "email and fullname are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            email,
            fullname
        }
    }, {
        new: true
    }).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, user, "account details updated successfully"))
});
const updateAvatar = asyncHandler(async (req, res) => {
    const newAvatarPath = req.file?.path;
    if (!newAvatarPath) {
        throw new ApiError(400, "avatar is required")
    }
    const avatar = await uploadOnCloudinary(newAvatarPath);
    if (!avatar.url) {
        throw new ApiError(400, "avatar not uploaded for some error")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true })
        .select("-password")
    return res.status(200)
        .json(
            new ApiResponse(200, user, "avatar updated successfully")
        )
})
const updateCover = asyncHandler(async (req, res) => {
    const newCoverPath = req.file?.path;
    if (!newCoverPath) {
        throw new ApiError(400, "cover is required")
    }
    const cover = await uploadOnCloudinary(newCoverPath);
    if (!cover.url) {
        throw new ApiError(400, "cover not uploaded for some error")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            cover: cover.url
        }
    }, { new: true })
        .select("-password")
    return res.status(200)
        .json(
            new ApiResponse(200, user, "cover updated successfully")
        )
})
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    const channel = User.aggregate([{
        $match: {
            username: username?.toLowerCase()
        }
    }, {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    }, {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },{
        $addFields:{
            subscribersCount:{
                $size:"$subscribers"
            },
            channelsSubcribedTo:{
                $size:"$subscribedTo"
            },
            isSubscribedTo:{
                $cond:{
                    if:{$in: [req.user?._id, "$subscribers.Subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
    },{
        $project:{
            email:1,
            username:1,
            fullname:1,
            avatar:1,
            cover:1,
            subscribersCount:1,
            channelsSubcribedTo:1,
            isSubscribedTo:1
        }
    }])
    if(!channel?.length){
        throw new ApiError(404, "channel not found")
    }
    return res.status(200)
    .json(new ApiResponse(200,channel[0],"channel fetched successfully"))
});
export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCover,getUserChannelProfile };