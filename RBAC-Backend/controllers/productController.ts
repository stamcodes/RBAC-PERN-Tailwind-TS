import { Request, Response } from "express";
import db from "../config/db";

// 16. GET /api/products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await db("products")
      .select(
        "products.id",
        "products.name",
        "products.description",
        "products.price",
        "products.is_active",
        db.raw(
          "COALESCE(json_agg(DISTINCT jsonb_build_object('id', categories.id, 'name', categories.name)) FILTER (WHERE categories.id IS NOT NULL), '[]'::json) as categories",
        ),
      )
      .leftJoin(
        "product_categories",
        "products.id",
        "product_categories.product_id",
      )
      .leftJoin("categories", "product_categories.category_id", "categories.id")
      .groupBy("products.id")
      .orderBy("products.id", "asc");

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch products." });
  }
};

// 17. POST /api/products
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, is_active, categoryIds } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "'name' and 'price' are required.",
      });
    }

    const existing = await db("products").where({ name }).first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A product with that name already exists.",
      });
    }

    await db.transaction(async (trx) => {
      const [newProduct] = await trx("products")
        .insert({
          name,
          description: description || null,
          price,
          is_active: is_active !== undefined ? is_active : true,
        })
        .returning(["id", "name", "description", "price", "is_active"]);

      if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        const categoryRecords = categoryIds.map((catId: number) => ({
          product_id: newProduct.id,
          category_id: catId,
        }));
        await trx("product_categories").insert(categoryRecords);
      }

      return res.status(201).json({ success: true, data: newProduct });
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create product." });
  }
};

// 18. GET /api/products/:id/variants
export const getProductVariants = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string, 10);

    const product = await db("products").where({ id: productId }).first();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const variants = await db("product_variants")
      .select(
        "product_variants.id",
        "product_variants.sku",
        "product_variants.price",
        "product_variants.stock_quantity",
        "product_variants.is_active", // ← ADD THIS
        db.raw(`
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'type', variant_types.type_name,
            'value', variant_values.value_name
          )
        ) FILTER (WHERE variant_values.id IS NOT NULL),
        '[]'
      ) as options
    `),
      )
      .leftJoin(
        "product_variant_options",
        "product_variants.id",
        "product_variant_options.product_variant_id",
      )
      .leftJoin(
        "variant_values",
        "product_variant_options.variant_value_id",
        "variant_values.id",
      )
      .leftJoin(
        "variant_types",
        "variant_values.variant_type_id",
        "variant_types.id",
      )
      .where("product_variants.product_id", productId)
      .groupBy("product_variants.id")
      .orderBy("product_variants.id", "asc");

    return res.status(200).json({ success: true, data: variants });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch variants." });
  }
};

// 19. POST /api/products/:id/variants
export const createProductVariant = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string, 10);
    const { sku, price, stock_quantity, variantValueIds } = req.body;

    if (!sku || price === undefined || stock_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "'sku', 'price', and 'stock_quantity' are required.",
      });
    }

    const product = await db("products").where({ id: productId }).first();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const existingSku = await db("product_variants").where({ sku }).first();
    if (existingSku) {
      return res
        .status(409)
        .json({ success: false, message: "SKU already exists." });
    }

    await db.transaction(async (trx) => {
      const [newVariant] = await trx("product_variants")
        .insert({ product_id: productId, sku, price, stock_quantity })
        .returning(["id", "product_id", "sku", "price", "stock_quantity"]);

      if (
        variantValueIds &&
        Array.isArray(variantValueIds) &&
        variantValueIds.length > 0
      ) {
        const optionRecords = variantValueIds.map((valueId: number) => ({
          product_variant_id: newVariant.id,
          variant_value_id: valueId,
        }));
        await trx("product_variant_options").insert(optionRecords);
      }

      return res.status(201).json({ success: true, data: newVariant });
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create variant." });
  }
};

// 20. PUT /api/products/variants/:variantId
export const updateProductVariant = async (req: Request, res: Response) => {
  try {
    const variantId: number = parseInt(req.params.variantId as string, 10);
    const { sku, price, stock_quantity, variantValueIds } = req.body;

    const existingVariant = await db("product_variants")
      .where({ id: variantId })
      .first();
    if (!existingVariant) {
      return res
        .status(404)
        .json({ success: false, message: "Variant not found." });
    }

    if (
      !sku &&
      price === undefined &&
      stock_quantity === undefined &&
      !variantValueIds
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided to update.",
      });
    }

    if (sku && sku !== existingVariant.sku) {
      const skuTaken = await db("product_variants").where({ sku }).first();
      if (skuTaken) {
        return res
          .status(409)
          .json({ success: false, message: "SKU already in use." });
      }
    }

    await db.transaction(async (trx) => {
      const updateFields: Record<string, any> = {};
      if (sku) updateFields.sku = sku;
      if (price !== undefined) updateFields.price = price;
      if (stock_quantity !== undefined)
        updateFields.stock_quantity = stock_quantity;

      if (Object.keys(updateFields).length > 0) {
        await trx("product_variants")
          .where({ id: variantId })
          .update(updateFields);
      }

      if (variantValueIds && Array.isArray(variantValueIds)) {
        await trx("product_variant_options")
          .where({ product_variant_id: variantId })
          .del();

        if (variantValueIds.length > 0) {
          const optionRecords = variantValueIds.map((valueId: number) => ({
            product_variant_id: variantId,
            variant_value_id: valueId,
          }));
          await trx("product_variant_options").insert(optionRecords);
        }
      }

      const updated = await trx("product_variants")
        .where({ id: variantId })
        .first();

      return res.status(200).json({ success: true, data: updated });
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update variant." });
  }
};

// GET /api/products/variant-values
export const getVariantValues = async (req: Request, res: Response) => {
  try {
    const rows = await db("variant_types")
      .select(
        "variant_types.id as typeId",
        "variant_types.type_name as typeName",
        "variant_values.id as valueId",
        "variant_values.value_name as valueName",
      )
      .leftJoin(
        "variant_values",
        "variant_types.id",
        "variant_values.variant_type_id",
      )
      .orderBy(["variant_types.id", "variant_values.id"]);

    interface GroupedType {
      typeId: number;
      typeName: string;
      values: { id: number; name: string }[];
    }

    const grouped: { [key: number]: GroupedType } = {};

    for (const row of rows) {
      if (!grouped[row.typeId]) {
        grouped[row.typeId] = {
          typeId: row.typeId,
          typeName: row.typeName,
          values: [],
        };
      }
      if (row.valueId) {
        grouped[row.typeId].values.push({
          id: row.valueId,
          name: row.valueName,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch variant values." });
  }
};

// PATCH /api/products/variants/:variantId/active
export const toggleVariantActive = async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.variantId as string, 10);

    // 1. Fetch the existing variant state
    const variant = await db("product_variants")
      .where({ id: variantId })
      .first();

    if (!variant) {
      return res
        .status(404)
        .json({ success: false, message: "Variant not found." });
    }

    // 2. Perform the update
    await db("product_variants")
      .where({ id: variantId })
      .update({ is_active: !variant.is_active });

    // 3. Explicitly fetch the updated record from the DB
    const updated = await db("product_variants")
      .where({ id: variantId })
      .first();

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle variant status." });
  }
};
