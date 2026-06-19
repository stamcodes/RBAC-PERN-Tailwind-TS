// ==========================================
// 16. GET /api/products
// ==========================================
/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Retrieve all products with their categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 17. POST /api/products
// ==========================================
/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Create a new product with optional category assignments
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Running Shoes
 *               description:
 *                 type: string
 *                 example: High performance running shoes
 *               price:
 *                 type: number
 *                 example: 59.99
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Product created successfully.
 *       400:
 *         description: Missing required fields.
 *       409:
 *         description: Product name already exists.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 18. GET /api/products/:id/variants
// ==========================================
/**
 * @openapi
 * /api/products/{id}/variants:
 *   get:
 *     summary: Retrieve all variants for a specific product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Variants retrieved successfully.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 19. POST /api/products/:id/variants
// ==========================================
/**
 * @openapi
 * /api/products/{id}/variants:
 *   post:
 *     summary: Add a new variant to a product
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
 *               - sku
 *               - price
 *               - stock_quantity
 *             properties:
 *               sku:
 *                 type: string
 *                 example: SHOE-RED-42
 *               price:
 *                 type: number
 *                 example: 49.99
 *               stock_quantity:
 *                 type: integer
 *                 example: 100
 *               variantValueIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 3]
 *     responses:
 *       201:
 *         description: Variant created successfully.
 *       400:
 *         description: Missing required fields.
 *       404:
 *         description: Product not found.
 *       409:
 *         description: SKU already exists.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 20. PUT /api/products/variants/:variantId
// ==========================================
/**
 * @openapi
 * /api/products/variants/{variantId}:
 *   put:
 *     summary: Update an existing product variant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The variant ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *                 example: SHOE-BLUE-42
 *               price:
 *                 type: number
 *                 example: 54.99
 *               stock_quantity:
 *                 type: integer
 *                 example: 80
 *               variantValueIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3]
 *     responses:
 *       200:
 *         description: Variant updated successfully.
 *       400:
 *         description: No update fields provided.
 *       404:
 *         description: Variant not found.
 *       409:
 *         description: SKU already in use.
 *       500:
 *         description: Server error.
 */
