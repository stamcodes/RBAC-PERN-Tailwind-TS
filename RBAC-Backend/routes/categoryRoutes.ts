import express from "express";
import * as categoryController from "../controllers/categoryController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Apply auth middleware to all routes below
router.use(authenticateToken);

// GET /api/categories
router.get("/", categoryController.getAllCategories);

// POST /api/categories (Changed from "/categories" to "/" to avoid double-nesting)
router.post("/", categoryController.createCategory);

export default router;
