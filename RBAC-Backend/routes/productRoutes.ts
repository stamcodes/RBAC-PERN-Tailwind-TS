import express from "express";
import * as productController from "../controllers/productController";
import * as categoryController from "../controllers/categoryController";
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

// Category assignment — handlers live in categoryController
router.post("/:id/categories", categoryController.addProductCategory);
router.delete(
  "/:id/categories/:categoryId",
  categoryController.removeProductCategory,
);

export default router;
