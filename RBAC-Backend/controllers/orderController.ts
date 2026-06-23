import { Response } from "express";
import db from "../config/db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// ==========================================
// 1. GET /api/orders
// ==========================================
export const getAllOrders = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const orders = await db("orders")
      .select(
        "orders.id",
        "orders.customer_name",
        "orders.status",
        "orders.total_amount",
        "orders.created_at",
        "orders.branch_id",
        "orders.created_by_user_id",
        "users.email as created_by_email",
        "branches.name as branch_name",
      )
      .leftJoin("users", "orders.created_by_user_id", "users.id")
      .leftJoin("branches", "orders.branch_id", "branches.id")
      .orderBy("orders.created_at", "desc");

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("[ORDER_FETCH_ALL_ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error reading order registry.",
    });
  }
};

// ==========================================
// 2. GET /api/orders/:id
// ==========================================
export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Project-standard clean string cast adaptation
    const paramIdString = String(req.params.id);
    const orderId = parseInt(paramIdString, 10);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format parameter.",
      });
    }

    const order = await db("orders")
      .select(
        "orders.id",
        "orders.customer_name",
        "orders.status",
        "orders.total_amount",
        "orders.created_at",
        "orders.branch_id",
        "orders.created_by_user_id",
        "branches.name as branch_name",
      )
      .leftJoin("branches", "orders.branch_id", "branches.id")
      .where("orders.id", orderId)
      .first();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Requested transaction statement not found.",
      });
    }

    const items = await db("order_items")
      .select(
        "order_items.id",
        "order_items.quantity",
        "order_items.price_at_purchase",
        "order_items.product_variant_id",
        "product_variants.sku",
        "products.name as product_name",
      )
      .leftJoin(
        "product_variants",
        "order_items.product_variant_id",
        "product_variants.id",
      )
      .leftJoin("products", "product_variants.product_id", "products.id")
      .where("order_items.order_id", orderId);

    return res.status(200).json({ success: true, data: { ...order, items } });
  } catch (error) {
    console.error(`[ORDER_FETCH_SINGLE_ERROR ID: ${req.params.id}]:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal error processing item layout extraction.",
    });
  }
};

// ==========================================
// 3. POST /api/orders
// ==========================================
export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { customer_name, branch_id, items } = req.body;
    const created_by_user_id = req.user?.userId;

    if (!created_by_user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Valid user session token context required.",
      });
    }

    if (!branch_id || isNaN(Number(branch_id))) {
      return res.status(400).json({
        success: false,
        message: "A valid branch identifier is required.",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoice data array must contain at least one line item.",
      });
    }

    const targetVariantIds = items.map((i) => i.product_variant_id);
    const variantsFromDb = await db("product_variants")
      .whereIn("id", targetVariantIds)
      .andWhere({ is_active: true });

    const variantMap = new Map(variantsFromDb.map((v) => [v.id, v]));

    const resultOrderRecord = await db.transaction(async (trx) => {
      let total_amount = 0;
      const orderItemInserts: Array<{
        product_variant_id: number;
        quantity: number;
        price_at_purchase: number;
      }> = [];

      for (const inputItem of items) {
        const variant = variantMap.get(inputItem.product_variant_id);

        if (!variant) {
          throw new Error(
            `NOT_FOUND: Product SKU configuration for ID ${inputItem.product_variant_id} is missing or inactive.`,
          );
        }

        if (variant.stock_quantity < inputItem.quantity) {
          throw new Error(
            `STOCK_ERROR: Inventory threshold breached for SKU: ${variant.sku}. Requested: ${inputItem.quantity}, Available: ${variant.stock_quantity}.`,
          );
        }

        const calculatedLinePrice =
          parseFloat(variant.price) * inputItem.quantity;
        total_amount += calculatedLinePrice;

        orderItemInserts.push({
          product_variant_id: inputItem.product_variant_id,
          quantity: inputItem.quantity,
          price_at_purchase: parseFloat(parseFloat(variant.price).toFixed(2)),
        });
      }

      const [newOrder] = await trx("orders")
        .insert({
          customer_name: customer_name?.trim() || "Walk-in Customer",
          status: "open",
          branch_id: Number(branch_id),
          created_by_user_id: Number(created_by_user_id),
          total_amount: parseFloat(total_amount.toFixed(2)),
        })
        .returning("*");

      const preparedItemRows = orderItemInserts.map((item) => ({
        order_id: newOrder.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
      }));

      await trx("order_items").insert(preparedItemRows);

      for (const item of preparedItemRows) {
        await trx("product_variants")
          .where({ id: item.product_variant_id })
          .decrement("stock_quantity", item.quantity);
      }

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: "Order billing profile finalized and committed successfully.",
      data: resultOrderRecord,
    });
  } catch (error: any) {
    console.error("[CRITICAL_ORDER_TRANSACTION_FAILURE]:", error);

    if (error.message.startsWith("NOT_FOUND:")) {
      return res.status(404).json({
        success: false,
        message: error.message.replace("NOT_FOUND: ", ""),
      });
    }
    if (error.message.startsWith("STOCK_ERROR:")) {
      return res.status(400).json({
        success: false,
        message: error.message.replace("STOCK_ERROR: ", ""),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Database transaction exception during order finalization.",
    });
  }
};

// ==========================================
// 4. PATCH /api/orders/:id/status
// ==========================================
export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const paramIdString = String(req.params.id);
    const orderId = parseInt(paramIdString, 10);
    const { status } = req.body;

    const validStatuses = ["open", "ready", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status updates must explicitly match: ${validStatuses.join(", ")}.`,
      });
    }

    const [updatedOrder] = await db("orders")
      .where({ id: orderId })
      .update({ status })
      .returning("*");

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Target order record to update status parameters was not located.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order lifecycle operational status transitioned successfully.",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("[ORDER_STATUS_PATCH_ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error adjusting transaction phase states.",
    });
  }
};

// ==========================================
// 5. POST /api/orders/:id/items
// ==========================================
export const addOrderItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const paramIdString = String(req.params.id);
    const orderId = parseInt(paramIdString, 10);
    const { product_variant_id, quantity } = req.body;

    if (!product_variant_id || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message:
          "Valid configuration for product_variant_id and quantity required.",
      });
    }

    const order = await db("orders").where({ id: orderId }).first();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Target invoice matrix frame reference not found.",
      });
    }

    const variant = await db("product_variants")
      .where({ id: product_variant_id, is_active: true })
      .first();
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant catalog entry unavailable.",
      });
    }

    if (variant.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock depletion ceiling breach. Max available: ${variant.stock_quantity}.`,
      });
    }

    await db.transaction(async (trx) => {
      const existingItem = await trx("order_items")
        .where({ order_id: orderId, product_variant_id })
        .first();

      if (existingItem) {
        await trx("order_items")
          .where({ id: existingItem.id })
          .increment("quantity", quantity);
      } else {
        await trx("order_items").insert({
          order_id: orderId,
          product_variant_id,
          quantity,
          price_at_purchase: parseFloat(parseFloat(variant.price).toFixed(2)),
        });
      }

      await trx("product_variants")
        .where({ id: product_variant_id })
        .decrement("stock_quantity", quantity);

      const allItems = await trx("order_items").where({ order_id: orderId });
      const newTotal = allItems.reduce(
        (sum: number, item: any) =>
          sum + parseFloat(item.price_at_purchase) * item.quantity,
        0,
      );

      await trx("orders")
        .where({ id: orderId })
        .update({ total_amount: parseFloat(newTotal.toFixed(2)) });
    });

    return res.status(201).json({
      success: true,
      message: "Line item added and structural totals updated successfully.",
    });
  } catch (error) {
    console.error("[ADD_ORDER_ITEM_ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed adding operational sub-item to database structure.",
    });
  }
};

// ==========================================
// 6. PUT /api/orders/:id/items/:itemId
// ==========================================
export const updateOrderItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const paramOrderIdString = String(req.params.id);
    const paramItemIdString = String(req.params.itemId);

    const orderId = parseInt(paramOrderIdString, 10);
    const itemId = parseInt(paramItemIdString, 10);
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Operational item count tracking must equal 1 or higher.",
      });
    }

    const item = await db("order_items")
      .where({ id: itemId, order_id: orderId })
      .first();
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Target invoice row instance not found.",
      });
    }

    const variant = await db("product_variants")
      .where({ id: item.product_variant_id })
      .first();
    const quantityDiff = quantity - item.quantity;

    if (quantityDiff > 0 && variant.stock_quantity < quantityDiff) {
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory balances. Shortfall calculation variance: ${variant.stock_quantity}.`,
      });
    }

    await db.transaction(async (trx) => {
      await trx("order_items")
        .where({ id: itemId })
        .update({ quantity, updated_at: db.fn.now() });

      if (quantityDiff > 0) {
        await trx("product_variants")
          .where({ id: item.product_variant_id })
          .decrement("stock_quantity", quantityDiff);
      } else if (quantityDiff < 0) {
        await trx("product_variants")
          .where({ id: item.product_variant_id })
          .increment("stock_quantity", Math.abs(quantityDiff));
      }

      const allItems = await trx("order_items").where({ order_id: orderId });
      const newTotal = allItems.reduce(
        (sum: number, i: any) =>
          sum + parseFloat(i.price_at_purchase) * i.quantity,
        0,
      );

      await trx("orders")
        .where({ id: orderId })
        .update({ total_amount: parseFloat(newTotal.toFixed(2)) });
    });

    return res.status(200).json({
      success: true,
      message: "Invoice matrix line metric recalculation successful.",
    });
  } catch (error) {
    console.error("[UPDATE_ORDER_ITEM_ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed adjusting computational item array matrix bounds.",
    });
  }
};

// ==========================================
// 7. DELETE /api/orders/:id/items/:itemId
// ==========================================
export const removeOrderItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const paramOrderIdString = String(req.params.id);
    const paramItemIdString = String(req.params.itemId);

    const orderId = parseInt(paramOrderIdString, 10);
    const itemId = parseInt(paramItemIdString, 10);

    const item = await db("order_items")
      .where({ id: itemId, order_id: orderId })
      .first();
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Target line item row missing from collection data.",
      });
    }

    await db.transaction(async (trx) => {
      await trx("order_items").where({ id: itemId }).del();
      await trx("product_variants")
        .where({ id: item.product_variant_id })
        .increment("stock_quantity", item.quantity);

      const allItems = await trx("order_items").where({ order_id: orderId });
      const newTotal = allItems.reduce(
        (sum: number, i: any) =>
          sum + parseFloat(i.price_at_purchase) * i.quantity,
        0,
      );

      await trx("orders")
        .where({ id: orderId })
        .update({ total_amount: parseFloat(newTotal.toFixed(2)) });
    });

    return res.status(200).json({
      success: true,
      message: "Line item excised cleanly; stock balance values rolled back.",
    });
  } catch (error) {
    console.error("[REMOVE_ORDER_ITEM_ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed database row removal operations on item context.",
    });
  }
};

// ==========================================
// 8. DELETE /api/orders/:id
// ==========================================
export const deleteOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const paramIdString = String(req.params.id);
    const orderId = parseInt(paramIdString, 10);

    const order = await db("orders").where({ id: orderId }).first();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Target parent order ledger frame missing.",
      });
    }

    await db.transaction(async (trx) => {
      const items = await trx("order_items").where({ order_id: orderId });

      for (const item of items) {
        await trx("product_variants")
          .where({ id: item.product_variant_id })
          .increment("stock_quantity", item.quantity);
      }

      await trx("orders").where({ id: orderId }).del();
    });

    return res.status(200).json({
      success: true,
      message:
        "Transaction statement voided entirely; active inventory items safely reinstated.",
    });
  } catch (error) {
    console.error("[VOID_ORDER_LEDGER_ERROR]:", error);
    return res.status(500).json({
      success: false,
      message:
        "Internal server crash processing parent ledger record clearance.",
    });
  }
};
