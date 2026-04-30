"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const client_1 = require("../generated/prisma/client");
function errorHandler(err, req, res, next) {
    var _a;
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({ errors: err.format() });
    }
    // Prisma known errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002":
                return res.status(409).json({ error: `${(_a = err.meta) === null || _a === void 0 ? void 0 : _a.target} already exists` });
            case "P2025":
                return res.status(404).json({ error: "Record not found" });
            case "P2003":
                return res.status(400).json({ error: "Related record does not exist" });
            default:
                return res.status(500).json({ error: "Database error" });
        }
    }
    // Log unknown errors server-side — never expose details to client
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
}
