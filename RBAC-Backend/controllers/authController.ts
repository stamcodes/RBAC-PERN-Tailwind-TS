import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key";

// 1. POST /api/auth/register
export const register = async (req: Request, res: Response) => {
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
};

// 2. POST /api/auth/login
export const login = async (req: Request, res: Response) => {
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
};

// 3. GET /api/auth/me
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
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
};

// 4. POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email and new password are required.",
        });
    }

    const user = await db("users").where({ email }).first();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found with that email." });
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
};

// 5. PATCH /api/auth/deactivate
export const deactivate = async (req: AuthenticatedRequest, res: Response) => {
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
};
