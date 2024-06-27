import {Router} from "express";
import {upload} from '../middlewares/multer.middleware.js';
import {verifyJWT} from '../middlewares/auth.middleware.js';
import {publishVideo,getVideoById,updateVideo,updateThumbnail,togglePublishStatus} from '../controllers/video.controller.js';
const router = Router();
router.route("/video-publish").post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),publishVideo)

router.route("/video/:videoId").get(getVideoById);
router.route("/video/:videoId").patch(updateVideo);
router.route("/videoUpdate/:videoId").patch(upload.single("thumbnail"),updateThumbnail)
router.route("/videoToggle/:videoId").patch(togglePublishStatus)
export default router;