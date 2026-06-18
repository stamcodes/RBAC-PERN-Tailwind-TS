import { Response, NextFunction } from "express";
import db from "../config/db";
import { AuthenticatedRequest } from "./authMiddleware";

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const roleId = req.user?.roleId;
    if (!roleId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. Session data missing.",
      });
      return;
    }

    const role = await db("roles").where({ id: roleId }).first();

    if (!role || role.name !== "Admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Administrative privileges required.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("RBAC Guard Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal role validation failure." });
    return;
  }
};
