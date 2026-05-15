"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmBooking = exports.getBookingsByUserQuery = exports.deleteBooking = exports.createBooking = exports.getBookingById = exports.getAllBookings = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const emails_1 = require("../templates/emails");
const email_1 = require("../config/email");
const getAllBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bookings = yield prisma_1.default.booking.findMany({
        include: {
            guest: { select: { name: true } },
            listing: { select: { title: true, location: true } }
        }
    });
    res.json(bookings);
});
exports.getAllBookings = getAllBookings;
const getBookingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params["id"];
    const booking = yield prisma_1.default.booking.findUnique({
        where: { id },
        include: { guest: true, listing: true }
    });
    if (!booking)
        return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
});
exports.getBookingById = getBookingById;
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guestId = req.userId; // From JWT
        const { listingId, checkIn, checkOut } = req.body;
        if (!listingId || !checkIn || !checkOut) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start >= end)
            return res.status(400).json({ error: "Check-in must be before check-out" });
        if (start < today)
            return res.status(400).json({ error: "Check-in cannot be in the past" });
        const listing = yield prisma_1.default.listing.findUnique({ where: { id: listingId } });
        if (!listing)
            return res.status(404).json({ error: "Listing not found" });
        // Conflict Check
        const conflict = yield prisma_1.default.booking.findFirst({
            where: {
                listingId,
                status: "CONFIRMED",
                checkIn: { lt: end },
                checkOut: { gt: start }
            }
        });
        if (conflict)
            return res.status(409).json({ error: "Listing is already booked for these dates" });
        // Price Calculation
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = days * listing.pricePerNight;
        const newBooking = yield prisma_1.default.booking.create({
            data: {
                guest: {
                    connect: { id: guestId }
                },
                listing: {
                    connect: { id: listingId }
                },
                checkIn: start,
                checkOut: end,
                totalPrice,
                status: "PENDING"
            }
        });
        res.status(201).json(newBooking);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        console.log(error, "error while create booking");
    }
});
exports.createBooking = createBooking;
const deleteBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params["id"];
    const booking = yield prisma_1.default.booking.findUnique({ where: { id } });
    if (!booking)
        return res.status(404).json({ error: "Booking not found" });
    if (booking.guestId !== req.userId)
        return res.status(403).json({ error: "You can only cancel your own bookings" });
    if (booking.status === "CANCELLED")
        return res.status(400).json({ error: "Booking is already cancelled" });
    const updated = yield prisma_1.default.booking.update({
        where: { id },
        data: { status: "CANCELLED" }
    });
    try {
        //  Get Guest and Listing details for the email
        const fullBooking = yield prisma_1.default.booking.findUnique({
            where: { id },
            include: { guest: true, listing: true }
        });
        if (fullBooking === null || fullBooking === void 0 ? void 0 : fullBooking.guest.email) {
            const html = (0, emails_1.bookingCancellationTemplate)(fullBooking.guest.name, fullBooking.listing.title, fullBooking.checkIn.toLocaleDateString(), fullBooking.checkOut.toLocaleDateString());
            yield (0, email_1.sendEmail)(fullBooking.guest.email, `Cancelled: Your booking for ${fullBooking.listing.title}`, html);
        }
    }
    catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
    }
    res.json({ message: "Booking cancelled", booking: updated });
});
exports.deleteBooking = deleteBooking;
const getBookingsByUserQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sk } = req.query;
    if (!sk) {
        return res.status(400).json({ error: "Search sk is required" });
    }
    const bookings = yield prisma_1.default.booking.findMany({
        where: {
            guest: {
                OR: [
                    { email: sk },
                    { username: sk },
                    { phone: sk }
                ]
            }
        },
        include: {
            listing: true, // Show what was booked
            guest: {
                select: { name: true, email: true } // Show who booked it
            }
        }
    });
    if (bookings.length === 0) {
        return res.status(404).json({ message: "No bookings found for this user search key" });
    }
    res.json(bookings);
});
exports.getBookingsByUserQuery = getBookingsByUserQuery;
const confirmBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params["id"];
        // Find the booking and include the listing to check ownership
        const booking = yield prisma_1.default.booking.findUnique({
            where: { id },
            include: { listing: true }
        });
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        //  Authorization: Only the Host who owns the listing or an ADMIN can confirm
        if (booking.listing.hostId !== req.userId || req.role !== "ADMIN") {
            return res.status(403).json({ error: "Only the host who owns the listing or an ADMIN can confirm this booking" });
        }
        // Prevent confirming already cancelled or confirmed bookings
        if (booking.status !== "PENDING") {
            return res.status(400).json({ error: `Cannot confirm a booking that is already ${booking.status}` });
        }
        // Update the status
        const confirmedBooking = yield prisma_1.default.booking.update({
            where: { id },
            include: { guest: true },
            data: { status: "CONFIRMED" }
        });
        try {
            //  Get Guest and Listing details for the email
            const fullBooking = yield prisma_1.default.booking.findUnique({
                where: { id },
                include: { guest: true, listing: true }
            });
            if (fullBooking && fullBooking.guest.email) {
                const checkInStr = fullBooking.checkIn.toLocaleDateString();
                const checkOutStr = fullBooking.checkOut.toLocaleDateString();
                const html = (0, emails_1.bookingConfirmationTemplate)(fullBooking.guest.name, fullBooking.listing.title, fullBooking.listing.location, checkInStr, checkOutStr, fullBooking.totalPrice);
                yield (0, email_1.sendEmail)(fullBooking.guest.email, `Confirmation: Your stay at ${fullBooking.listing.title}`, html);
            }
        }
        catch (emailError) {
            console.error("Failed to send cancellation email:", emailError);
        }
        res.json({ message: "Booking confirmed successfully", booking: confirmedBooking });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.confirmBooking = confirmBooking;
