import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tweet } from '../models/tweet.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from "../models/user.models.js"
import mongoose from 'mongoose';

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "tweet content is required")
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })
    if (!tweet) {
        throw new ApiError(400, "tweet not created")
    }
    return res.status(201).json(new ApiResponse(201, tweet, "tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        throw new ApiError(400, "userId is required for fetching tweets")
    }
    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $project: {
                content: 1,
            }
        }
    ])
    if(!userTweets){
        throw new ApiError(404, "tweets not found")
    }
    console.log(userTweets);
    return res.status(200).json(new ApiResponse(200, userTweets, "tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;
    if (!tweetId) {
        throw new ApiError(400, "tweetId is required for updating tweet")
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "tweet not found")
    }
    if (!content) {
        throw new ApiError(400, "tweet content is required for updating tweet")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(tweet?._id,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )
    if (!updatedTweet) {
        throw new ApiError(400, "tweet not updated")
    }
    return res.status(200).json(new ApiResponse(200, updatedTweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!tweetId) {
        throw new ApiError(400, "tweetId is required for deleting tweet")
    }
    const tweet = await Tweet.findByIdAndDelete(tweetId);
    if (!tweet) {
        throw new ApiError(404, "tweet not found")
    }
    return res.status(200).json(new ApiResponse(200, {}, "tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}