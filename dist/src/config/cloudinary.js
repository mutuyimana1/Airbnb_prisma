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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = uploadToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary with your account credentials
// This must run before any upload calls
cloudinary_1.v2.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
    api_key: process.env["CLOUDINARY_API_KEY"],
    api_secret: process.env["CLOUDINARY_API_SECRET"],
});
// uploadToCloudinary takes a file buffer and uploads it to Cloudinary
// folder: organizes files in your Cloudinary media library
// Returns the upload result which includes secure_url and public_id
function uploadToCloudinary(buffer, folder) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            // upload_stream is used when you have a buffer (not a file path)
            // It opens a writable stream that Cloudinary reads from
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                // resource_type: "auto" detects whether it's an image or video
                resource_type: "auto",
            }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            });
            // Write the buffer into the stream and close it
            stream.end(buffer);
        });
    });
}
// deleteFromCloudinary removes a file from Cloudinary by its public_id
// Call this when a user deletes their profile picture or a listing photo
function deleteFromCloudinary(publicId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield cloudinary_1.v2.uploader.destroy(publicId);
    });
}
exports.default = cloudinary_1.v2;
