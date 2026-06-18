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
      return res
        .status(403)
        .json({
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
router.get("/", async (req: Request, res: Response) => {
  try {
    const permissions = await db("permissions")
      .select("id", "name", "description", "created_at")
      .orderBy("id", "asc");

    return res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch permissions." });
  }
});

export default router;
