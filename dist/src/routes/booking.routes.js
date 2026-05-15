"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const booking_controller_1 = require("../controllers/booking.controller");
/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management for guests and hosts
 * components:
 *   schemas:
 *     BookingStatus:
 *       type: string
 *       enum: [PENDING, CONFIRMED, CANCELLED]
 *       description: The current state of a booking
 *
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         checkIn:
 *           type: string
 *           format: date-time
 *         checkOut:
 *           type: string
 *           format: date-time
 *         totalPrice:
 *           type: number
 *         status:
 *           $ref: '#/components/schemas/BookingStatus'
 *         listingId:
 *           type: string
 *         guestId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const router = (0, express_1.Router)();
// /**
//  * @swagger
// * /bookings/search:
//  *   get:
//  *     summary: Search bookings for the logged-in user
//  *     description: Returns bookings filtered by the authenticated user's ID.
//  *     tags: [Bookings]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Search results
//  */
router.get("/search", auth_middleware_1.authenticate, booking_controller_1.getBookingsByUserQuery);
/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     description: Retrieve a list of all bookings in the system.
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: List of bookings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get("/", booking_controller_1.getAllBookings);
/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Booking not found
 */
router.get("/:id", booking_controller_1.getBookingById);
/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Allows a guest to book a listing. Requires "Guest" role.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listingId, checkIn, checkOut, totalPrice]
 *             properties:
 *               listingId:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created
 *       403:
 *         description: Forbidden - Only guests can book
 */
router.post("/", auth_middleware_1.authenticate, auth_middleware_1.requireGuest, booking_controller_1.createBooking);
/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel/Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted
 */
router.delete("/:id", auth_middleware_1.authenticate, booking_controller_1.deleteBooking);
/**
 * @swagger
* /bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm a booking
 *     description: Allows a host to confirm a pending booking for their listing.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking confirmed
 *       403:
 *         description: Forbidden - Only hosts can confirm
 *
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         checkIn:
 *           type: string
 *           format: date-time
 *         checkOut:
 *           type: string
 *           format: date-time
 *         totalPrice:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *         listingId:
 *           type: string
 *         guestId:
 *           type: string
 */
router.patch("/:id/confirm", auth_middleware_1.authenticate, auth_middleware_1.requireHost, booking_controller_1.confirmBooking);
exports.default = router;
