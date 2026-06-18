import express, { Request, Response } from "express";
import { z } from "zod";
import db from "../config/db";

// 🚀 Clean, production-grade file-separated middleware imports
import { authenticateToken } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rbacMiddleware";

const router = express.Router();

const roleIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Role ID must be a valid numeric string"),
});

// Chain the isolated components sequentially
router.use(authenticateToken);
router.use(requireAdmin);

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

router.get("/", async (req: Request, res: Response) => {
  try {
    const roles = await db("roles")
      .select("id", "name", "description", "created_at")
      .orderBy("id", "asc");

    return res.status(200).json({ success: true, data: roles });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch system roles." });
  }
});

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
router.post("/:id/permissions", async (req: Request, res: Response) => {
  try {
    const result = roleIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID format.",
      });
    }

    const { id } = result.data;
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: "Body must contain a 'permissionIds' array.",
      });
    }

    const targetRoleId = parseInt(id, 10);
    const targetRole = await db("roles").where({ id: targetRoleId }).first();
    if (!targetRole) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found." });
    }

    await db.transaction(async (trx) => {
      await trx("role_permissions").where({ role_id: targetRoleId }).del();

      if (permissionIds.length > 0) {
        const joinRecords = permissionIds.map((permId: number) => ({
          role_id: targetRoleId,
          permission_id: permId,
        }));
        await trx("role_permissions").insert(joinRecords);
      }
    });

    return res.status(200).json({
      success: true,
      message: `Permissions assigned successfully to role: '${targetRole.name}'.`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to assign permissions." });
  }
});

export default router;
