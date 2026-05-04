import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { bookingCancellationTemplate, bookingConfirmationTemplate } from '../templates/emails';
import { sendEmail } from '../config/email';

export const getAllBookings = async (req: Request, res: Response) => {
  const bookings = await prisma.booking.findMany({
    include: {
      guest: { select: { name: true } },
      listing: { select: { title: true } }
    }
  });
  res.json(bookings);
};

export const getBookingById = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { guest: true, listing: true }
  });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(booking);
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const guestId = req.userId!; // From JWT
    const { listingId, checkIn, checkOut } = req.body;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start >= end) return res.status(400).json({ error: "Check-in must be before check-out" });
    if (start < today) return res.status(400).json({ error: "Check-in cannot be in the past" });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Conflict Check
    const conflict = await prisma.booking.findFirst({
      where: {
        listingId,
        status: "CONFIRMED",
        checkIn: { lt: end },
        checkOut: { gt: start }
      }
    });

    if (conflict) return res.status(409).json({ error: "Listing is already booked for these dates" });

    // Price Calculation
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = days * listing.pricePerNight;

    const newBooking = await prisma.booking.create({
      data: {
        guest:{
          connect:{id:guestId}
        },
        listing:{
          connect:{id:listingId}
        },
        checkIn: start,
        checkOut: end,
        totalPrice,
        status: "PENDING"
      }
    });
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error,"error while create booking")
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.guestId !== req.userId) return res.status(403).json({ error: "You can only cancel your own bookings" });
  if (booking.status === "CANCELLED") return res.status(400).json({ error: "Booking is already cancelled" });

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" }
  });

try {
    //  Get Guest and Listing details for the email
    const fullBooking = await prisma.booking.findUnique({
        where: { id },
        include: { guest: true, listing: true }
    });

    if (fullBooking?.guest.email) {
        const html = bookingCancellationTemplate(
            fullBooking.guest.name,
            fullBooking.listing.title,
            fullBooking.checkIn.toLocaleDateString(),
            fullBooking.checkOut.toLocaleDateString()
        );

        await sendEmail(fullBooking.guest.email, `Cancelled: Your booking for ${fullBooking.listing.title}`, html);
    }
} catch (emailError) {
    console.error("Failed to send cancellation email:", emailError);
}

  res.json({ message: "Booking cancelled", booking: updated });
};

export const getBookingsByUserQuery = async (req: Request, res: Response) => {
  const { sk } = req.query; 

  if (!sk) {
    return res.status(400).json({ error: "Search sk is required" });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      guest: {
        OR: [
          { email: sk as string },
          { username: sk as string },
          { phone: sk as string }
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
};

export const confirmBooking = async (req: Request, res: Response) => {
    try {
        const id = req.params["id"] as string;
        // Find the booking and include the listing to check ownership
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { listing: true }
        });

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        //  Authorization: Only the Host who owns the listing or an ADMIN can confirm
        if (booking.listing.hostId !== req.userId && req.role !== "ADMIN") {
            return res.status(403).json({ error: "Only the host can confirm this booking" });
        }

        // Prevent confirming already cancelled or confirmed bookings
        if (booking.status !== "PENDING") {
            return res.status(400).json({ error: `Cannot confirm a booking that is already ${booking.status}` });
        }

        // Update the status
        const confirmedBooking = await prisma.booking.update({
            where: { id },
            include:{guest:true},
            data: { status: "CONFIRMED" }
        });
try {
    //  Get Guest and Listing details for the email
    const fullBooking = await prisma.booking.findUnique({
        where: { id },
        include: { guest: true, listing: true }
    });

    
  
    if (fullBooking && fullBooking.guest.email) {
        const checkInStr = fullBooking.checkIn.toLocaleDateString();
        const checkOutStr = fullBooking.checkOut.toLocaleDateString();
        
        const html = bookingConfirmationTemplate(
            fullBooking.guest.name,
            fullBooking.listing.title,
            fullBooking.listing.location,
            checkInStr,
            checkOutStr,
            fullBooking.totalPrice
        );
        await sendEmail(fullBooking.guest.email, `Confirmation: Your stay at ${fullBooking.listing.title}`, html);
    }
} catch (emailError) {
    console.error("Failed to send cancellation email:", emailError);
}
        res.json({ message: "Booking confirmed successfully", booking: confirmedBooking });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

