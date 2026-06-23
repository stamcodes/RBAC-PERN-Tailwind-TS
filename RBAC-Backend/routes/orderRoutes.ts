import express from "express";
import * as orderController from "../controllers/orderController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Protect all order-related endpoints with authentication middleware
router.use(authenticateToken);

// ==========================================
// Base Order Operations
// ==========================================

// GET /api/orders - Retrieve all orders
router.get("/", orderController.getAllOrders);

// POST /api/orders - Create a brand new order bill with items
router.post("/", orderController.createOrder);

// GET /api/orders/:id - Fetch a single detailed order with line items
router.get("/:id", orderController.getOrderById);

// DELETE /api/orders/:id - Delete an open/cancelled order and restore stock
router.delete("/:id", orderController.deleteOrder);

// PATCH /api/orders/:id/status - Transition order status (open, ready, completed, cancelled)
router.patch("/:id/status", orderController.updateOrderStatus);

// ==========================================
// Order Sub-item Operations (POS adjustments)
// ==========================================

// POST /api/orders/:id/items - Add a new item/variant to an active order bill
router.post("/:id/items", orderController.addOrderItem);

// PUT /api/orders/:id/items/:itemId - Update quantity for a specific line item
router.put("/:id/items/:itemId", orderController.updateOrderItem);

// DELETE /api/orders/:id/items/:itemId - Remove a line item entirely and restore stock
router.delete("/:id/items/:itemId", orderController.removeOrderItem);

export default router;
