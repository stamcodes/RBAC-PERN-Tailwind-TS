import { Request, Response } from "express";
import { z } from "zod";
import db from "../config/db";

const roleIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Role ID must be a valid numeric string"),
});

// 10. GET /api/roles
export const getAllRoles = async (req: Request, res: Response) => {
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
};

// 11. GET /api/permissions
export const getAllPermissions = async (req: Request, res: Response) => {
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
};

// 12. POST /api/roles/:id/permissions
export const assignPermissions = async (req: Request, res: Response) => {
  try {
    const result = roleIdParamSchema.safeParse(req.params);
    if (!result.success) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role ID format." });
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
};
