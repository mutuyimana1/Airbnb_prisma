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
exports.uploadListingPhotos = exports.deleteAvatar = void 0;
exports.uploadAvatar = uploadAvatar;
const cloudinary_js_1 = require("../config/cloudinary.js");
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
// POST /users/:id/avatar
// Uploads a profile picture for a user
// Multer middleware runs first and puts the file on req.file
// Then we upload the buffer to Cloudinary and save the URL to the database
function uploadAvatar(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = parseInt(req.params["id"]);
        // ensure user edit their own profile
        if (req.userId !== id) {
            console.log(req.userId, "compare", id);
            return res.status(403).json({ error: 'Forbidden:You can only change your own profile' });
        }
        // req.file is set by Multer — if it's missing, no file was sent
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const user = yield prisma_js_1.default.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // delete old avatar
        if (user.avatarPublicId) {
            yield (0, cloudinary_js_1.deleteFromCloudinary)(user.avatarPublicId);
        }
        // Upload the buffer to Cloudinary under the "airbnb/avatars" folder
        const { url, publicId } = yield (0, cloudinary_js_1.uploadToCloudinary)(req.file.buffer, "airbnb/avatars");
        // Save the Cloudinary URL to the user's record in the database
        const updated = yield prisma_js_1.default.user.update({
            where: { id },
            data: { avatar: url, avatarPublicId: publicId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                avatarPublicId: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({ message: "Avatar uploaded successfully", avatar: updated });
    });
}
const deleteAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params["id"]);
    if (req.userId !== id) {
        return res.status(403).json({ error: "Forbidden" });
    }
    const user = yield prisma_js_1.default.user.findUnique({ where: { id } });
    if (!user) {
        return res.status(404).json("user not found");
    }
    if (!user.avatar || !user.avatarPublicId) {
        return res.status(404).json('Avatar not found');
    }
    yield (0, cloudinary_js_1.deleteFromCloudinary)(user.avatarPublicId);
    const updatedUser = yield prisma_js_1.default.user.update({
        where: { id },
        data: {
            avatar: null,
            avatarPublicId: null
        },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            avatarPublicId: true,
            createdAt: true,
            updatedAt: true
        }
    });
    res.json({ message: 'Avatar deleted successsfully', updatedUser });
});
exports.deleteAvatar = deleteAvatar;
const uploadListingPhotos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params["id"]);
    const listing = yield prisma_js_1.default.listing.findUnique({ where: { id } });
    if (!listing) {
        return res.status(404).json("Listing not found");
    }
    if (listing.hostId === req.userId) {
        return res.status(403).json('User should be host');
    }
    const countPhoto = yield prisma_js_1.default.listingPhoto.count({ where: { listingId: id } });
    if (countPhoto >= 5) {
        return res.status(400).json({ message: 'Maximum of photos allowed per listing' });
    }
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'no file uploaded' });
    }
    ;
    //calculate slots and limit files
    const remainingSlots = 5 - countPhoto;
    const filesToUpload = files.slice(0, remainingSlots);
    //process uploads concurrently
    const uploadPromises = filesToUpload.map((file) => __awaiter(void 0, void 0, void 0, function* () {
        const { url, publicId } = yield (0, cloudinary_js_1.uploadToCloudinary)(file.buffer, "airbnb/listings");
        return prisma_js_1.default.listingPhoto.create({
            data: {
                url,
                publicId,
                listingId: id
            }
        });
    }));
    yield Promise.all(uploadPromises);
    // return uploaded listing with photos
    const uploadedListing = yield prisma_js_1.default.listing.findUnique({
        where: { id },
        include: {
            photos: true
        }
    });
    res.json({ message: `Successfully uploaded ${filesToUpload.length} photos`, listing: uploadedListing });
});
exports.uploadListingPhotos = uploadListingPhotos;
