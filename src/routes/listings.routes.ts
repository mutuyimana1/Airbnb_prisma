import { Router } from "express";
import { authenticate, requireHost } from "../middlewares/auth.middleware";
import { createListing, deleteListing, getAllListings, getListingById, updateListing } from "../controllers/listings.controller";
/**
 * @swagger
 * components:
 *   schemas:
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         title:
 *           type: string
 *           example: App launch
 *         description:
 *           type: string
 *           example: for celebrating
 *         location:
 *           type: string
 *           example: Kigali_serena
 *         pricePerNight:
 *           type: number
 *           format: float
 *           example: 10000
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00.000Z
 *
 *     CreateListInput:
 *       type: object
 *       required: [title, description, location, pricePerNight]
 *       properties:
 *         title:
 *           type: string
 *           example: App launch
 *         description:
 *           type: string
 *           example: for celebrating
 *         location:
 *           type: string
 *           example: Kigali_serena
 *         pricePerNight:
 *           type: number
 *           format: float
 *           example: 10000
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *           example: APARTMENT
 *
 *     UpdateListingInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         pricePerNight:
 *           type: number
 *           format: float
 */

const router=Router();

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings
 *     description: Returns a list of all registered listings. Requires authentication.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 *       401:
 *         description: Unauthorized
 */


router.get("/",getAllListings);
/**
 * @swagger
 * /listings/{id}:
 *  get:
 *     summary: Get a listing by ID
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: Listing found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id",getListingById);
/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing
 *     description: Create a new property listing. Only users with the "Host" role can perform this action.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListInput'
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Host role required
 */
router.post("/",authenticate,requireHost,createListing);
/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update an existing listing
 *     description: Update listing details. Only the host who created the listing can update it.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the listing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateListingInput'
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *       403:
 *         description: Forbidden - You do not own this listing
 *       404:
 *         description: Listing not found
 */
router.put("/:id",authenticate,updateListing);
/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     description: Permanently remove a listing. Only the host who created the listing can delete it.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the listing
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       403:
 *         description: Forbidden - You do not own this listing
 *       404:
 *         description: Listing not found
 */
router.delete("/:id",authenticate,deleteListing);

export default router;