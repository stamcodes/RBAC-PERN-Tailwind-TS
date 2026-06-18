import express from "express";
import * as roleController from "../controllers/rolePermissionsController"; // Shares the same controller!
import { authenticateToken } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rbacMiddleware";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", roleController.getAllPermissions);

export default router;
