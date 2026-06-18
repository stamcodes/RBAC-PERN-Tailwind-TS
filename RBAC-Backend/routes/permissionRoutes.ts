import express, { Request, Response } from "express";
import db from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rbacMiddleware";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

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
