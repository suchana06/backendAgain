import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async(filepath)=>{
   try {
    if(!filepath) return null;
    const uploadResult = await cloudinary.uploader.upload(filepath,{
        resource_type: "auto"
    })
    console.log("file uploaded successfully");
    return uploadResult;
   } catch (error) {
    fs.unlink(filepath);
    return null;
   }
}

export {uploadOnCloudinary}
