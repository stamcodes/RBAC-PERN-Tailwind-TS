import express from "express";
import * as branchController from "../controllers/branchController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rbacMiddleware";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", branchController.getAllBranches);
router.get("/:id/users", branchController.getBranchUsers); // ← new
router.post("/", branchController.createBranch);
router.post("/assign", branchController.assignUserToBranch);

export default router;
