// ==========================================
// 10. GET /api/roles
// ==========================================
/**
 * @openapi
 * /api/roles:
 *   get:
 *     summary: Retrieve all available authorization roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System roles retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 11. GET /api/permissions
// ==========================================
/**
 * @openapi
 * /api/permissions:
 *   get:
 *     summary: Retrieve all available system permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions catalog retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 12. POST /api/roles/:id/permissions
// ==========================================

/**
 * @openapi
 * /api/roles/{id}/permissions:
 *   post:
 *     summary: Assign permissions to a role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionIds
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 5]
 *     responses:
 *       200:
 *         description: Permissions assigned successfully.
 *       400:
 *         description: Missing or malformed permissionIds.
 *       404:
 *         description: Role not found.
 *       500:
 *         description: Server error.
 */
