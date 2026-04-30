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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.getMe = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const email_1 = require("../config/email");
const emails_1 = require("../templates/emails");
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, username, password, role } = req.body;
        // fields validation
        if (!name || !email || !username || !password) {
            return res.status(400).json({ error: 'All fields (name, email, username, password) are required' });
        }
        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        // Check if email or username is already taken
        const existingUser = yield prisma_1.default.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'Email or username already taken' });
        }
        // Validate Role (HOST or GUEST only)
        const finalRole = role !== null && role !== void 0 ? role : 'GUEST';
        if (!['HOST', 'GUEST'].includes(finalRole)) {
            return res.status(400).json({ error: 'Invalid role. Must be HOST or GUEST' });
        }
        // Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create user
        const user = yield prisma_1.default.user.create({
            data: {
                name,
                email,
                username,
                password: hashedPassword,
                role: finalRole,
            },
        });
        const htmlBody = (0, emails_1.welcomeEmail)(name, role);
        yield (0, email_1.sendEmail)(email, "Welcome to Airbnb!", htmlBody);
        // Return user without password
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.status(201).json(userWithoutPassword);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // 1. Validate inputs
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // 2. Find user by email
        const user = yield prisma_1.default.user.findUnique({
            where: { email }
        });
        // 3. Verify user exists and password matches
        if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // 4. Generate JWT Token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        // 5. Return success with token and user info (excluding password)
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.status(200).json({
            message: 'Login successful',
            token
            // user: userWithoutPassword
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.login = login;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                listings: req.role === 'HOST',
                bookings: req.role === 'GUEST' ? {
                    include: {
                        listing: {
                            select: {
                                id: true,
                                title: true,
                                location: true,
                                pricePerNight: true
                            }
                        }
                    }
                } : false
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.status(200).json(userWithoutPassword);
    }
    catch (error) {
        console.error(error);
        return res.json({ error });
    }
});
exports.getMe = getMe;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
        //validate
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Both current and new passwords are required" });
        }
        // Fetch user
        const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Verify currentPassword
        const isMatch = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect current password" });
        }
        //  Validate newPassword length
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "New password must be at least 8 characters long" });
        }
        // Hash and update
        const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma_1.default.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });
        return res.status(200).json({ message: "Password updated successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.changePassword = changePassword;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        //  Find user
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        //  Always return 200 to prevent email enumeration
        res.status(200).json({ message: "Reset link has been sent" });
        if (user) {
            //  Generate raw token and hash it
            const rawToken = crypto_1.default.randomBytes(32).toString("hex");
            const hashedToken = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
            const restLink = `http://localhost:3000/auth/reset-password/${rawToken}`;
            const html = (0, emails_1.passwordResetEmail)(user.name, restLink);
            //  Set expiry (1 hour)
            const expiry = new Date(Date.now() + 60 * 60 * 1000);
            // Save hashed token to DB
            yield prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    resetToken: hashedToken,
                    resetTokenExpiry: expiry
                }
            });
            yield (0, email_1.sendEmail)(user.email, `Reset Password`, html);
            // (Log it to console for testing) rater will send to email
            console.log(`Reset Link:${restLink}`);
        }
        else {
            console.log("no user");
        }
    }
    catch (error) {
        console.error(error);
        if (!res.headersSent)
            res.status(500).json({ error: "Internal server error" });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        const rawToken = token;
        const { newPassword } = req.body;
        // Hash the incoming raw token to match the DB
        const hashedToken = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
        // Find user with valid, non-expired token
        const user = yield prisma_1.default.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() }
            }
        });
        // error message
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }
        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: "New password must be at least 8 characters long" });
        }
        //  Hash new password and clear tokens
        const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
            }
        });
        return res.status(200).json({ message: "Password reset successful. You can now log in." });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.resetPassword = resetPassword;
