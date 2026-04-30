"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createUserSchema = zod_1.default.object({
    name: zod_1.default.string().min(2, "Name must be at least 2 characters"),
    email: zod_1.default.string().email("Invalid email format"),
    username: zod_1.default.string().min(3, "Username must be at least 3 characters"),
    phone: zod_1.default.string().min(7, "Invalid phone number"),
    role: zod_1.default.enum(["HOST", "GUEST"]).default("GUEST"),
});
exports.updateUserSchema = exports.createUserSchema.partial(); // All fields optional for update
