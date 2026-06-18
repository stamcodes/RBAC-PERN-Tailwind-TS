import express from "express";
import * as productController from "../controllers/productController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rbacMiddleware";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", productController.getAllProducts);
router.post("/", productController.createProduct);
router.get("/:id/variants", productController.getProductVariants);
router.post("/:id/variants", productController.createProductVariant);
router.put("/variants/:variantId", productController.updateProductVariant);

export default router;
