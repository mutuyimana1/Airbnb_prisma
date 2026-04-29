import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import upload from "../config/multer";
import { deleteAvatar, uploadAvatar, uploadListingPhotos } from "../controllers/upload.controller";


const router=Router();
/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (jpeg, png, webp — max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Invalid file format or size
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/avatar",authenticate,upload.single("image"),uploadAvatar);
router.delete("/:id/avatar",authenticate,deleteAvatar)
/**
 * @swagger
 * /listings/{id}/photos:
 *   post:
 *     summary: Upload multiple photos to a listing (Max 5)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *       400:
 *         description: Maximum of 5 photos allowed
 *
 * /listings/{id}/photos/{photoId}:
 *   delete:
 *     summary: Delete a specific listing photo
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 *       403:
 *         description: Forbidden - Photo does not belong to this listing or you are not the host
 */

router.post("/listings/:id/photos",authenticate,upload.array("photos",5),uploadListingPhotos)

export default router