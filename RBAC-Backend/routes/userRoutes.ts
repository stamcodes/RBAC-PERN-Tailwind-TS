import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../config/db";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    roleId: number;
  };
}

// ==========================================
// AUTHENTICATION & RBAC MIDDLEWARE
// ==========================================

const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access denied. Token missing." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      roleId: number;
    };
    req.user = verified;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roleId = req.user?.roleId;
    const role = await db("roles").where({ id: roleId }).first();

    if (!role || role.name !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrator privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal role verification error." });
  }
};

router.use(authenticateToken);
router.use(requireAdmin);

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
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await db("users")
      .select(
        "id",
        "name",
        "email",
        "role_id",
        "is_active",
        "created_at",
        "updated_at",
      )
      .orderBy("id", "asc");

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user directory records.",
    });
  }
});

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
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await db("users")
      .where({ id })
      .select(
        "id",
        "name",
        "email",
        "role_id",
        "is_active",
        "created_at",
        "updated_at",
      )
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Target user record could not be found.",
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error reading target profile context.",
    });
  }
});

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
router.patch("/:id/role", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({
        success: false,
        message: "The role_id parameter is required.",
      });
    }

    const targetRole = await db("roles").where({ id: role_id }).first();
    if (!targetRole) {
      return res.status(404).json({
        success: false,
        message: "The specified target role does not exist.",
      });
    }

    const updatedCount = await db("users")
      .where({ id })
      .update({ role_id, updated_at: new Date() });

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Target user profile record was not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User role changed successfully to '${targetRole.name}'.`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update role mapping." });
  }
});

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
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updatedCount = await db("users")
      .where({ id })
      .update({ is_active: false, updated_at: new Date() });

    if (updatedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Target user account not found." });
    }

    return res.status(200).json({
      success: true,
      message: "User account deactivated successfully.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to deactivate user account." });
  }
});

export default router;
