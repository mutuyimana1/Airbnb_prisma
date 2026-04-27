import { Router } from "express";
import { authenticate, requireHost } from "../middlewares/auth.middleware";
import { createListing, deleteListing, getAllListings, getListingById, updateListing } from "../controllers/listings.controller";

const router=Router();

router.get("/",getAllListings);
router.get("/:id",getListingById);
router.post("/",authenticate,requireHost,createListing);
router.put("/:id",authenticate,updateListing);
router.delete("/:id",authenticate,deleteListing);

export default router;