import jwt from 'jsonwebtoken';
import { Video } from '../models/video.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const publishVideo = asyncHandler(async(req,res)=>{
    const {title, description} = req.body;
    if(!(title && description)){
        throw new ApiError(400,"title and description are required")
    }
    const videoFilePath = req.files?.videoFile[0]?.path;
    const thumbnailPath=req.files?.thumbnail[0]?.path;
    if(!videoFilePath ||!thumbnailPath){
        throw new ApiError(400,"video and thumbnail are not provided")
    }
    const videoFile = await uploadOnCloudinary(videoFilePath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if(!videoFile) {
        throw new ApiError(400,"video not uploaded")
    }
    console.log(videoFile);
    if(!thumbnail) {
        throw new ApiError(400,"thumbnail not uploaded")
    }
    const createdvideo = await Video.create({
        title,
        description,
        owner:req.user?._id,
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        duration: videoFile.duration
    })
    const video = await Video.findById(createdvideo._id).select("-views -duration -isPublished")
    if(!video){
        throw new ApiError(401,"something went wrong")
    }
    const responseData = {
        _id: video._id,
        title: video.title,
        description: video.description,
        owner: video.owner,
        videoFile: video.videoFile,
        thumbnail: video.thumbnail,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
        // Add more fields as needed
    };
    return res.status(201).json(new ApiResponse(201, responseData, "Video published successfully"));
})
export {publishVideo}