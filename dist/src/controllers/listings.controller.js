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
exports.deleteListing = exports.updateListing = exports.createListing = exports.getListingById = exports.getAllListings = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = require("redis");
const redis = (0, redis_1.createClient)({ url: process.env["REDIS_URL"] });
//get listings
const getAllListings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const cachedListings=await redis.get("listings");
    // if(cachedListings){
    //     return res.json(JSON.parse(cachedListings));
    // }
    const listings = yield prisma_1.default.listing.findMany({
        include: {
            photos: true
        }
    });
    // await redis.setEx("listings",60,JSON.stringify(listings));
    res.json(listings);
});
exports.getAllListings = getAllListings;
//Get Listing by id
const getListingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params["id"];
    const listingById = yield prisma_1.default.listing.findUnique({ where: { id }, include: { photos: true } });
    if (!listingById) {
        return res.status(404).json({ error: `Listing with id ${id} not found` });
    }
    res.json(listingById);
});
exports.getListingById = getListingById;
//Create Listing
const createListing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, pricePerNight, guests, location, emenities } = req.body;
        if (!title || !description || !pricePerNight) {
            return res.status(400).json({ error: 'Title, description, and price per night are required' });
        }
        if (typeof pricePerNight !== 'number' || pricePerNight <= 0) {
            return res.status(400).json({ error: 'Price per night must be a positive number' });
        }
        if (typeof guests !== 'number' || guests <= 0) {
            return res.status(400).json({ error: 'Guests must be a positive number' });
        }
        const hostId = req.userId;
        if (!hostId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const newListing = yield prisma_1.default.listing.create({ data: { title, description, pricePerNight, guests, emenities, hostId, host: {
                    connect: { id: hostId } // The code handles the "connect" logic
                }, location } });
        //   await redis.del("listings");
        res.status(201).json(newListing);
    }
    catch (error) {
        res.status(500).json({ message: error, error: "Internal server error" });
        console.error(error, "error while creating listing");
    }
});
exports.createListing = createListing;
//update listing
const updateListing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params["id"];
    const listing = yield prisma_1.default.listing.findUnique({ where: { id } });
    if (!listing) {
        return res.status(404).json({ error: `Listing with id ${id} not found` });
    }
    // Check ownership or admin role
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
        return res.status(403).json({ error: "You can only edit your own listings" });
    }
    const updatedListing = yield prisma_1.default.listing.update({ where: { id }, data: req.body });
    // await redis.del("listings");
    res.json(updatedListing);
});
exports.updateListing = updateListing;
//delete listing
const deleteListing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params["id"];
    const listing = yield prisma_1.default.listing.findUnique({ where: { id } });
    if (!listing) {
        return res.status(404).json({ error: `Listing with id ${id} not found` });
    }
    // Check ownership or admin role
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
        return res.status(403).json({ error: "You can only edit your own listings" });
    }
    yield prisma_1.default.listing.delete({ where: { id } });
    // await redis.del("listings");
    res.json({ message: 'Listing deleted successfully' });
});
exports.deleteListing = deleteListing;
