// ==========================================
// 13. GET /api/branches
// ==========================================
/**
 * @openapi
 * /api/branches:
 *   get:
 *     summary: Retrieve all branches
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branches retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 14. POST /api/branches
// ==========================================
/**
 * @openapi
 * /api/branches:
 *   post:
 *     summary: Create a new branch
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
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: Downtown Branch
 *               location:
 *                 type: string
 *                 example: 123 Main Street, Karachi
 *     responses:
 *       201:
 *         description: Branch created successfully.
 *       400:
 *         description: Missing required fields.
 *       409:
 *         description: Branch name already exists.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 15. POST /api/branches/assign
// ==========================================
/**
 * @openapi
 * /api/branches/assign:
 *   post:
 *     summary: Assign a user to a branch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - branchId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 3
 *               branchId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: User assigned to branch successfully.
 *       400:
 *         description: Missing required fields.
 *       404:
 *         description: User or branch not found.
 *       409:
 *         description: User already assigned to this branch.
 *       500:
 *         description: Server error.
 */

// ==========================================
// GET /api/branches/:id/users
// ==========================================
/**
 * @openapi
 * /api/branches/{id}/users:
 *   get:
 *     summary: Get all users assigned to a branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch users retrieved successfully.
 *       400:
 *         description: Invalid branch ID.
 *       404:
 *         description: Branch not found.
 *       500:
 *         description: Server error.
 */
