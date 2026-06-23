import { Request, Response } from "express";
import db from "../config/db";

// ==========================================
// 1. GET /api/categories
// ==========================================
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await db("categories")
      .select("id", "name", "description", "branch_id", "created_at")
      .orderBy("id", "asc");

    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories." });
  }
};

// ==========================================
// MISSING CONTROLLER ADDED: POST /api/categories
// ==========================================
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, branch_id } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required." });
    }

    // Check if a category with the same name already exists
    const existingCategory = await db("categories")
      .where({ name: name.trim() })
      .first();

    if (existingCategory) {
      return res
        .status(409)
        .json({ success: false, message: "Category name already exists." });
    }

    // Insert new category row into database
    const [newCategory] = await db("categories")
      .insert({
        name: name.trim(),
        description: description || null,
        branch_id: branch_id || null,
      })
      .returning(["id", "name", "description", "branch_id"]);

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: newCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category on backend database server.",
    });
  }
};

// ==========================================
// 22. POST /api/products/:id/categories
// ==========================================
export const addProductCategory = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string, 10);
    const { categoryId } = req.body;

    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "categoryId is required." });
    }

    const product = await db("products").where({ id: productId }).first();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const category = await db("categories").where({ id: categoryId }).first();
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    const existing = await db("product_categories")
      .where({ product_id: productId, category_id: categoryId })
      .first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Category already assigned to this product.",
      });
    }

    await db("product_categories").insert({
      product_id: productId,
      category_id: categoryId,
    });

    return res
      .status(201)
      .json({ success: true, message: "Category added to product." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add category." });
  }
};

// ==========================================
// 24. DELETE /api/products/:id/categories/:categoryId
// ==========================================
export const removeProductCategory = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string, 10);
    const categoryId = parseInt(req.params.categoryId as string, 10);

    const existing = await db("product_categories")
      .where({ product_id: productId, category_id: categoryId })
      .first();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not assigned to this product.",
      });
    }

    await db("product_categories")
      .where({ product_id: productId, category_id: categoryId })
      .del();

    return res
      .status(200)
      .json({ success: true, message: "Category removed from product." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to remove category." });
  }
};
