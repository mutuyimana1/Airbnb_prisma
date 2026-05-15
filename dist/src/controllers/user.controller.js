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
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const zod_1 = __importDefault(require("zod"));
//get users
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query["page"]) || 1;
    const limit = parseInt(req.query["limit"]) || 20;
    const skip = (page - 1) * limit;
    const [users, total] = yield Promise.all([
        prisma_1.default.user.findMany({ skip, take: limit }),
        prisma_1.default.user.count(),
    ]);
    // meta tells the client how many page exist so that to take control.
    res.json({ data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});
exports.getAllUsers = getAllUsers;
// get all users by using cursor which is good for large dataset
// export async function getAllUsersx(req: Request, res: Response) {
//   const cursor = req.query["cursor"]  as string| undefined;
//   const limit = parseInt(req.query["limit"] as string) || 20;
//   const users = await prisma.user.findMany({
//     take: limit,
//     skip: cursor ? 1 : 0,
//     cursor: cursor ? { id: cursor } : undefined,
//     orderBy:[
//         {createdAt:"desc"},
//         { id: "asc" }],
//   });
//   const nextCursor = users.length === limit ? users[users.length - 1]?.id : null;
//   res.json({ data: users, nextCursor });
// }
//Get User by id
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params["id"];
    const userById = yield prisma_1.default.user.findUnique({ where: { id },
        include: {
            listings: true,
            bookings: {
                include: { listing: true }
            }
        }
    });
    if (!userById) {
        return res.status(404).json({ error: `User with id ${id} not found` });
    }
    const { password: _ } = userById, userWithoutPassword = __rest(userById, ["password"]);
    res.json({ message: "User retrieved successfully", userWithoutPassword, status: 200 });
});
exports.getUserById = getUserById;
//Create User
const createUserSchema = zod_1.default.object({
    name: zod_1.default.string().min(2, "Name must be at least 2 characters long"),
    email: zod_1.default.string().email("Invalid email address"),
});
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, username, password, phone, role, bio, avatar } = req.body;
    ;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    try {
        const data = createUserSchema.parse(req.body);
        const newUser = yield prisma_1.default.user.create({ data: { name, email, username, password, phone, role, bio, avatar } });
        res.status(201).json(newUser);
    }
    catch (error) {
        next(error);
    }
});
exports.createUser = createUser;
//update user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params["id"];
    const user = yield prisma_1.default.user.findUnique({ where: { id } });
    if (!user) {
        return res.status(404).json({ error: `User with id ${id} not found` });
    }
    const updatedUser = yield prisma_1.default.user.update({ where: { id }, data: req.body });
    res.json(updatedUser);
});
exports.updateUser = updateUser;
//delete user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params["id"];
    const user = yield prisma_1.default.user.findUnique({ where: { id } });
    if (!user) {
        return res.status(404).json({ error: `User with id ${id} not found` });
    }
    yield prisma_1.default.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
});
exports.deleteUser = deleteUser;
