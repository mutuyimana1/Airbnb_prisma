import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] as string });
const prisma = new PrismaClient({ adapter });
async function main() {
    const hashedPassword=await bcrypt.hash("password123",10)
  console.log("🌱 Seeding database...");

  // Clean existing data first — order matters because of foreign keys
  // Delete in reverse order of dependencies
  await prisma.listingPhoto.deleteMany(); 
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();


  // ─── Seed Users ───────────────────────────────────────────────────────────

  const alice = await prisma.user.create({
    data: {
      name: "Alice Alia",
      email: "alicehost@example.com",
      username: "alice_host",
      password: hashedPassword, // use bcrypt in real seeds
      role: "HOST",
    },
  });
  const bob = await prisma.user.create({
    data: {
      name: "Bob Eric",
      email: "bobguest@example.com",
      username: "bob_guest",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  const carol = await prisma.user.create({
    data: {
      name: "Carol White",
      email: "carol@example.com",
      username: "carol_guest",
      password: hashedPassword,
      role: "GUEST",
    },
  });
// Create the admin user if they don't exist, update their name if they do
const admin = await prisma.user.upsert({
  where: { email: "admin@example.com" },   // find by this unique field
  update: { name: "Admin Updated" },        // if found — apply these changes
  create: {                                  // if not found — create with this data
    name: "Admin",
    email: "admin@example.com",
    username: "admin",
    password: hashedPassword,
    role: "ADMIN",
  },
});
  // ─── Seed Listings ────────────────────────────────────────────────────────

  const listing1 = await prisma.listing.create({
    data: {
      title: "Cozy apartment in downtown",
      description: "A beautiful apartment in the heart of the city",
      location: "New York, NY",
      pricePerNight: 120,
      guests: 2,
      type: "APARTMENT",
      emenities: ["WiFi", "Kitchen", "Air conditioning"],
      hostId: alice.id,
      host: { connect: { id: alice.id } }, // Use 'host' with 'connect'
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "Beach house with ocean view",
      description: "Wake up to stunning ocean views every morning",
      location: "Miami, FL",
      pricePerNight: 250,
      guests: 6,
      type: "HOUSE",
      emenities: ["WiFi", "Pool", "Beach access", "BBQ"],
      hostId: alice.id,
      host: { connect: { id: alice.id } }, // Use 'host' with 'connect'
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: "Mountain cabin retreat",
      description: "Escape the city in this peaceful mountain cabin",
      location: "Denver, CO",
      pricePerNight: 180,
      guests: 4,
      type: "CABIN",
      emenities: ["Fireplace", "Hiking trails", "WiFi"],
      hostId: alice.id,
      host: { connect: { id: alice.id } }, // Use 'host' with 'connect'
    },
  });

  console.log("🏠 Created listings");

  // ─── Seed Bookings ────────────────────────────────────────────────────────

  await prisma.booking.create({
    data: {
      checkIn: new Date("2025-08-01"),
      checkOut: new Date("2025-08-05"),
      totalPrice: 480, // 4 nights × 120
      status: "PENDING",
      guestId: bob.id,
      listingId: listing1.id,
    },
  });

  // await prisma.booking.create({
  //   data: {
  //     checkIn: new Date("2025-09-10"),
  //     checkOut: new Date("2025-09-15"),
  //     totalPrice: 1250, // 5 nights × 250
  //     status: "PENDING",
  //     guestId: carol.id,
  //     listingId: listing2.id,
  //   },
  // });

  console.log("📅 Created bookings");
  console.log("✅ Seeding complete!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });