import express from "express";
import * as userController from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rbacMiddleware";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id/role", userController.updateUserRole);
router.delete("/:id", userController.deactivateUser);

export default router;
