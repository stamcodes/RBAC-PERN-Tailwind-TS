// ==========================================
// GET /api/categories
// ==========================================
/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Retrieve all product categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */

// ==========================================
// POST /api/categories
// ==========================================
/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Create a brand new base category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Summer Collection
 *               description:
 *                 type: string
 *                 example: Light breathable styles
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Category created successfully.
 *       400:
 *         description: Missing required field name.
 *       401:
 *         description: Unauthorized.
 *       409:
 *         description: Category name already exists.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 23. POST /api/products/:id/categories
// ==========================================
/**
 * @openapi
 * /api/products/{id}/categories:
 *   post:
 *     summary: Assign a category to a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Category assigned to product successfully.
 *       400:
 *         description: Missing categoryId.
 *       404:
 *         description: Product or category not found.
 *       409:
 *         description: Category already assigned to this product.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 24. DELETE /api/products/:id/categories/:categoryId
// ==========================================
/**
 * @openapi
 * /api/products/{id}/categories/{categoryId}:
 *   delete:
 *     summary: Remove a category from a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The category ID to remove
 *     responses:
 *       200:
 *         description: Category removed from product successfully.
 *       404:
 *         description: Category not assigned to this product.
 *       500:
 *         description: Server error.
 */
