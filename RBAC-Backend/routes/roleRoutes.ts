import express from "express";
import * as roleController from "../controllers/rolePermissionsController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rbacMiddleware";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", roleController.getAllRoles);
router.post("/:id/permissions", roleController.assignPermissions);

export default router;
