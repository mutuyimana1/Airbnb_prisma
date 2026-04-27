import { Router } from "express";
import { authenticate, requireGuest, requireHost } from "../middlewares/auth.middleware";
import { getAllBookings, getBookingById, createBooking, deleteBooking, getBookingsByUserQuery ,confirmBooking} from "../controllers/booking.controller";
const router = Router();

router.get("/search", authenticate, getBookingsByUserQuery); 
router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.post("/", authenticate, requireGuest, createBooking);
router.delete("/:id", authenticate, deleteBooking);
router.patch("/:id/confirm",authenticate,requireHost,confirmBooking);


export default router;