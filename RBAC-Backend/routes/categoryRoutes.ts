import express from "express";
import * as categoryController from "../controllers/categoryController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authenticateToken);

router.get("/", categoryController.getAllCategories);

export default router;
