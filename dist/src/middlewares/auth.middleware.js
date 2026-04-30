"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireGuest = exports.requireHost = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const authenticate = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    }
    catch (ex) {
        return res.status(400).json({ error: 'Invalid token.' });
    }
};
exports.authenticate = authenticate;
const requireHost = (req, res, next) => {
    if (req.role !== 'HOST') {
        return res.status(403).json({ error: 'Host access required.' });
    }
    next();
};
exports.requireHost = requireHost;
const requireGuest = (req, res, next) => {
    if (req.role !== 'GUEST' && req.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. GUEST role required.' });
    }
    next();
};
exports.requireGuest = requireGuest;
