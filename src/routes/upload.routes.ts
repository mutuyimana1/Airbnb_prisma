import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import upload from "../config/multer";
import { uploadAvatar } from "../controllers/upload.controller";


const router=Router();

router.post("/:id/avatar",authenticate,upload.single("image"),uploadAvatar);

export default router