/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Retrieve all orders
 *     description: Fetches a list of all orders along with details about the branch and the staff user who created them. Sorted by creation date descending.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Orders retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 101
 *                       customer_name:
 *                         type: string
 *                         nullable: true
 *                         example: "Jane Doe"
 *                       status:
 *                         type: string
 *                         example: "open"
 *                       total_amount:
 *                         type: string
 *                         example: "149.98"
 *                       created_at:
 *                         type: string
 *                         example: "2026-06-23T14:05:00.000Z"
 *                       branch_id:
 *                         type: integer
 *                         example: 1
 *                       created_by_user_id:
 *                         type: integer
 *                         example: 4
 *                       created_by_name:
 *                         type: string
 *                         example: "Alex Staff"
 *                       branch_name:
 *                         type: string
 *                         example: "Downtown Branch"
 *       '401':
 *         description: Unauthorized. Missing or invalid token.
 *       '500':
 *         description: Server error.
 */

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Create a brand new order bill
 *     description: Initializes an order with variant line items. Real-time totals are computed server-side based on active variant prices, and stock counts are automatically decremented.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *               - items
 *             properties:
 *               customer_name:
 *                 type: string
 *                 example: "Jane Doe"
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_variant_id
 *                     - quantity
 *                   properties:
 *                     product_variant_id:
 *                       type: integer
 *                       example: 12
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       '201':
 *         description: Order created successfully.
 *       '400':
 *         description: Bad request. Missing fields, empty items array, or insufficient inventory stock.
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Product variant not found or inactive.
 *       '500':
 *         description: Server error.
 */

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     summary: Retrieve a single order with detailed items
 *     description: Fetches complete order meta information along with an aggregate array of purchased items, variants, and configurations.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique order ID
 *     responses:
 *       '200':
 *         description: Detailed order fetched successfully.
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Order not found.
 *       '500':
 *         description: Server error.
 */

/**
 * @openapi
 * /api/orders/{id}:
 *   delete:
 *     summary: Void/Delete an order record
 *     description: Deletes an open or cancelled order entirely from the system and reverts all reserved line item quantities back to product variant inventories.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order ID to delete
 *     responses:
 *       '200':
 *         description: Order deleted and stock successfully restored.
 *       '400':
 *         description: Cannot delete a completed order.
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Order not found.
 *       '500':
 *         description: Server error.
 */

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     description: Transitions an order between status lifecycle states.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, ready, completed, cancelled]
 *                 example: "completed"
 *     responses:
 *       '200':
 *         description: Order status updated.
 *       '400':
 *         description: Invalid status value provided.
 *       '404':
 *         description: Order not found.
 */

/**
 * @openapi
 * /api/orders/{id}/items:
 *   post:
 *     summary: Add a line item to an existing order
 *     description: Appends a variant item to an open order, updating stock levels and order total.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_variant_id
 *               - quantity
 *             properties:
 *               product_variant_id:
 *                 type: integer
 *                 example: 15
 *               quantity:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       '201':
 *         description: Item added successfully to order.
 *       '400':
 *         description: Order is locked or insufficient inventory.
 *       '404':
 *         description: Order or product variant not found.
 */

/**
 * @openapi
 * /api/orders/{id}/items/{itemId}:
 *   put:
 *     summary: Update line item quantity
 *     description: Increases or decreases the quantity of a line item on an open order, adjusting inventory and order total accordingly.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *     responses:
 *       '200':
 *         description: Line item quantity and order total updated.
 *       '400':
 *         description: Invalid quantity, order is locked, or insufficient stock.
 *       '404':
 *         description: Order or line item not found.
 */

/**
 * @openapi
 * /api/orders/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove a line item from an order
 *     description: Removes a single line item from an open order, recalculates the order total, and restores the stock quantity.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Line item removed and stock restored.
 *       '400':
 *         description: Order is closed or locked.
 *       '404':
 *         description: Order or line item not found.
 */
