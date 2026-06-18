import { Request, Response } from "express";
import db from "../config/db";

// 6. GET /api/users
export const getAllUsers = async (req: Request, res: Response) => {
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
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch user directory records.",
      });
  }
};

// 7. GET /api/users/:id
export const getUserById = async (req: Request, res: Response) => {
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
      return res
        .status(404)
        .json({
          success: false,
          message: "Target user record could not be found.",
        });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error reading target profile context.",
      });
  }
};

// 8. PATCH /api/users/:id/role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "The role_id parameter is required.",
        });
    }

    const targetRole = await db("roles").where({ id: role_id }).first();
    if (!targetRole) {
      return res
        .status(404)
        .json({
          success: false,
          message: "The specified target role does not exist.",
        });
    }

    const updatedCount = await db("users")
      .where({ id })
      .update({ role_id, updated_at: new Date() });

    if (updatedCount === 0) {
      return res
        .status(404)
        .json({
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
};

// 9. DELETE /api/users/:id
export const deactivateUser = async (req: Request, res: Response) => {
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
};
