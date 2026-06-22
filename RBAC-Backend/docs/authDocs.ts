// ==========================================
// 1. POST /api/auth/register
// ==========================================
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alex Developer
 *               email:
 *                 type: string
 *                 example: alex@test.com
 *               password:
 *                 type: string
 *                 example: SuperSecretPassword123
 *     responses:
 *       201:
 *         description: Account successfully provisioned.
 *       400:
 *         description: Missing payload fields.
 *       409:
 *         description: Email already registered.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 2. POST /api/auth/login
// ==========================================
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: alex@test.com
 *               password:
 *                 type: string
 *                 example: SuperSecretPassword123
 *     responses:
 *       200:
 *         description: Handshake successful.
 *       400:
 *         description: Missing fields.
 *       401:
 *         description: Invalid credentials.
 *       403:
 *         description: Account deactivated.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 3. GET /api/auth/me
// ==========================================
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get authenticated user details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data resolved successfully.
 *       401:
 *         description: Unauthorized. Missing or invalid token.
 *       404:
 *         description: User profile not found.
 *       500:
 *         description: Server error.
 */

// ==========================================
// 4. POST /api/auth/reset-password
// ==========================================
/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset account password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: alex@test.com
 *               newPassword:
 *                 type: string
 *                 example: BrandNewPassword2026!
 *     responses:
 *       200:
 *         description: Password altered successfully.
 *       400:
 *         description: Missing email or new password.
 *       404:
 *         description: No account found with that email.
 *       500:
 *         description: Server error.
 */
// ==========================================
// 5. PATCH /api/auth/deactivate
// ==========================================
/**
 * @openapi
 * /api/auth/deactivate:
 *   patch:
 *     summary: Deactivate authenticated user account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account successfully deactivated.
 *       401:
 *         description: Unauthorized. Missing or invalid token.
 *       500:
 *         description: Server error.
 */
