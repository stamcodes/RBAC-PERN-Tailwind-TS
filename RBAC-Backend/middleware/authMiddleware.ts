import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key";

// TypeScript interface for injecting authenticated user session state
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    roleId: number;
  };
}

// ==========================================
// AUTHENTICATION INTERCEPTOR MIDDLEWARE
// ==========================================
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer <token>"

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

// ==========================================
// ROLE-BASED ACCESS CONTROL (RBAC) GUARD
// ==========================================
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roleId = req.user?.roleId;
    if (!roleId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Session data missing.",
      });
    }

    const role = await db("roles").where({ id: roleId }).first();

    if (!role || role.name !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrative privileges required.",
      });
    }

    return next();
  } catch (error) {
    console.error("RBAC Guard Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal role validation failure." });
  }
};
