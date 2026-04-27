import { Router } from "express";
import { changePassword, forgotPassword, getMe, login, register, resetPassword } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router=Router();

router.post("/register",register);
router.post("/login",login);
router.get("/profile", authenticate, getMe);
router.post("/change-password", authenticate, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


export default router;