import { Request, Response } from "express";
import db from "../config/db";

// 13. GET /api/branches
export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const branches = await db("branches")
      .select("id", "name", "location")
      .orderBy("id", "asc");

    return res.status(200).json({ success: true, data: branches });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch branches." });
  }
};

// 14. POST /api/branches
export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: "Both 'name' and 'location' are required.",
      });
    }

    const existing = await db("branches").where({ name }).first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A branch with that name already exists.",
      });
    }

    const [newBranch] = await db("branches")
      .insert({ name, location })
      .returning(["id", "name", "location"]);

    return res.status(201).json({ success: true, data: newBranch });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create branch." });
  }
};

// 15. POST /api/branches/assign
export const assignUserToBranch = async (req: Request, res: Response) => {
  try {
    const { userId, branchId } = req.body;

    if (!userId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Both 'userId' and 'branchId' are required.",
      });
    }

    const user = await db("users").where({ id: userId }).first();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const branch = await db("branches").where({ id: branchId }).first();
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found." });
    }

    const existing = await db("user_branches")
      .where({ user_id: userId, branch_id: branchId })
      .first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User is already assigned to this branch.",
      });
    }

    await db("user_branches").insert({ user_id: userId, branch_id: branchId });

    return res.status(200).json({
      success: true,
      message: `User '${user.name}' successfully assigned to branch '${branch.name}'.`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to assign user to branch." });
  }
};

//22. GET /api/branches/:id/users
export const getBranchUsers = async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.id as string, 10);
    if (isNaN(branchId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid branch ID." });
    }

    const branch = await db("branches").where({ id: branchId }).first();
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found." });
    }

    const users = await db("user_branches")
      .join("users", "user_branches.user_id", "users.id")
      .join("roles", "users.role_id", "roles.id")
      .where("user_branches.branch_id", branchId)
      .select(
        "users.id",
        "users.name",
        "users.email",
        "roles.name as role_name",
      );

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch branch users." });
  }
};
