import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import upload from "../config/multer";
import { deleteAvatar, uploadAvatar, uploadListingPhotos } from "../controllers/upload.controller";


const router=Router();

router.post("/:id/avatar",authenticate,upload.single("image"),uploadAvatar);
router.delete("/:id/avatar",authenticate,deleteAvatar)
router.post("/listings/:id/photos",authenticate,upload.array("photos",5),uploadListingPhotos)

export default router