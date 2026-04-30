"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateListingSchema = exports.createListingSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createListingSchema = zod_1.default.object({
    title: zod_1.default.string().min(5, "Title must be at least 5 characters"),
    description: zod_1.default.string().min(10, "Description must be at least 10 characters"),
    location: zod_1.default.string().min(2, "Location is required"),
    pricePerNight: zod_1.default.number().positive("Price must be a positive number"),
    guests: zod_1.default.number().int().min(1, "Must allow at least 1 guest"),
    type: zod_1.default.enum(["APARTMENT", "HOUSE", "VILLA", "CABIN"]),
    amenities: zod_1.default.array(zod_1.default.string()).min(1, "At least one amenity is required"),
});
exports.updateListingSchema = exports.createListingSchema.partial(); // All fields optional for update
