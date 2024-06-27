import jwt from 'jsonwebtoken';
import { Video } from '../models/video.models.js';
import { upload } from '../middlewares/multer.middleware.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!(title && description)) {
        throw new ApiError(400, "title and description are required")
    }
    const videoFilePath = req.files?.videoFile[0]?.path;
    const thumbnailPath = req.files?.thumbnail[0]?.path;
    if (!videoFilePath || !thumbnailPath) {
        throw new ApiError(400, "video and thumbnail are not provided")
    }
    const videoFile = await uploadOnCloudinary(videoFilePath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!videoFile) {
        throw new ApiError(400, "video not uploaded")
    }
    console.log(videoFile);
    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not uploaded")
    }
    const createdvideo = await Video.create({
        title,
        description,
        owner: req.user?._id,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration
    })
    const video = await Video.findById(createdvideo._id).select("-views -duration -isPublished")
    if (!video) {
        throw new ApiError(401, "something went wrong")
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
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId?.trim()) {
        throw new ApiError(400, "videoId is missing")
    }
    const video = await Video.findById(videoId).select("-views -duration -isPublished")
    if (!video) {
        throw new ApiError(401, "video not found")
    }
    return res.status(200)
        .json(new ApiResponse(200, video, "video is fetched by ID successfully"))
})
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId?.trim()) {
        throw new ApiError(400, "videoId is missing");
    }

    const video = await Video.findById(videoId).select("-views -duration -isPublished");

    if (!video) {
        throw new ApiError(404, "video not found");
    }

    const { title, description } = req.body;
    const updateData = {};
    // Check if either title or description is provided
    if (title) {
        updateData.title = title;
    }

    if (description) {
        updateData.description = description;
    }

    // If no fields to update are provided, throw an error
    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "At least one field (title or description) is required for update");
    }

    const videoUpdated = await Video.findByIdAndUpdate(video._id, { $set: updateData }, { new: true });

    if (!videoUpdated) {
        throw new ApiError(404, "not updated for some reason");
    }

    return res.status(200).json(new ApiResponse(200, videoUpdated, "video updated successfully"));
});
const updateThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId?.trim()) {
        throw new ApiError(400, "videoId is missing");
    }

    const video = await Video.findById(videoId).select("-views -duration -isPublished");

    if (!video) {
        throw new ApiError(404, "video not found");
    }

    const thumbnailPath = req.file?.path;
    if (!thumbnailPath) {
        throw new ApiError(400, "thumbnail not found")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    const videoUpdate = await Video.findByIdAndUpdate(video?._id,
        {
            $set: {
                thumbnail: thumbnail.url
            }
        },
        {
            new: true
        }
    ).select("-isPublished -views -duration")
    if (!videoUpdate) {
        throw new ApiError(404, "not updated for some reason");
    }
    return res.status(200).json(new ApiResponse(200, videoUpdate, "thumbnail updated successfully"));
})
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "videoId is missing")
    }
    const vid = await Video.findById(videoId)
    const video = await Video.findByIdAndUpdate(vid?._id,
        {
            $set:{
                isPublished:!vid?.isPublished
            }
        },
        {
            new:true
        }
    )
    if (!video) {
        throw new ApiError(404, "video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "published status updated successfully"));
})



export {
    publishVideo,
    getVideoById,
    updateVideo,
    updateThumbnail,
    togglePublishStatus
}