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
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const listings_routes_1 = __importDefault(require("./routes/listings.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const prisma_1 = require("./config/prisma");
const errorHandler_1 = require("./middlewares/errorHandler");
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const swagger_1 = require("./config/swagger");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.use(express_1.default.json());
(0, swagger_1.setupSwagger)(app);
app.use('/users', users_routes_1.default);
app.use("/users", upload_routes_1.default);
app.use('/listings', listings_routes_1.default);
app.use('/auth', auth_routes_1.default);
app.use('/bookings', booking_routes_1.default);
app.use(errorHandler_1.errorHandler);
// Start the server
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, prisma_1.connectDb)();
        app.listen(PORT, () => {
            console.log(`Server running on :${PORT}`);
        });
    });
}
main().catch((error) => {
    console.error("Failed to connect to database", error);
    process.exit(1);
});
