import express from "express";
import * as authController from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticateToken, authController.getMe);
router.post("/reset-password", authController.resetPassword);
router.patch("/deactivate", authenticateToken, authController.deactivate);

export default router;
