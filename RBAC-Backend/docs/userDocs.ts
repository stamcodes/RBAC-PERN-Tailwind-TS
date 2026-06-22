// ==========================================
// 6. GET /api/users
// ==========================================
/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Retrieve a list of all system users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully.
 *       401:
 *         description: Unauthorized. Missing or invalid session token.
 *       403:
 *         description: Forbidden. Requires administrator role.
 *       500:
 *         description: Server database reading error.
 */

// ==========================================
// 7. GET /api/users/:id
// ==========================================
/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Fetch a specific user profile by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the user record
 *     responses:
 *       200:
 *         description: User profile resolved successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User record not found.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 8. PATCH /api/users/:id/role
// ==========================================
/**
 * @openapi
 * /api/users/{id}/role:
 *   patch:
 *     summary: Alter a user's assigned permission role
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
 *               - role_id
 *             properties:
 *               role_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: User role updated successfully.
 *       400:
 *         description: Missing or malformed payload.
 *       404:
 *         description: User or role not found.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 9. DELETE /api/users/:id
// ==========================================
/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Soft delete a user account by deactivating it
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User account deactivated successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */

// ==========================================
// PATCH /api/users/:id/password
// ==========================================
/**
 * @openapi
 * /api/users/{id}/password:
 *   patch:
 *     summary: Admin override to reset a user's password
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose password is being reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: NewSecurePassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Missing or invalid newPassword.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
