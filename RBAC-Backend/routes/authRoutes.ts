import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db";

import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key";

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
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields." });
    }

    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = await db("roles").where({ name: "Staff" }).first();

    if (!defaultRole) {
      return res
        .status(500)
        .json({ success: false, message: "Roles not seeded." });
    }

    const [newUser] = await db("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        role_id: defaultRole.id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(["id", "name", "email"]);

    return res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

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
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields." });
    }

    const user = await db("users").where({ email }).first();
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (!user.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "Account deactivated." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, roleId: user.role_id },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

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
router.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      const user = await db("users")
        .where({ id: userId })
        .select("id", "name", "email", "role_id", "is_active", "created_at")
        .first();

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User profile not found." });
      }

      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  },
);

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
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: alex@test.com
 *               currentPassword:
 *                 type: string
 *                 example: SuperSecretPassword123
 *               newPassword:
 *                 type: string
 *                 example: BrandNewPassword2026!
 *     responses:
 *       200:
 *         description: Password altered successfully.
 *       400:
 *         description: Missing fields.
 *       401:
 *         description: Invalid current verification details.
 *       500:
 *         description: Server error.
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const user = await db("users").where({ email }).first();
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization verification details.",
      });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await db("users")
      .where({ email })
      .update({ password: newHashedPassword, updated_at: new Date() });

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

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
router.patch(
  "/deactivate",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      await db("users")
        .where({ id: userId })
        .update({ is_active: false, updated_at: new Date() });

      return res
        .status(200)
        .json({ success: true, message: "Account deactivated successfully." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  },
);

export default router;
