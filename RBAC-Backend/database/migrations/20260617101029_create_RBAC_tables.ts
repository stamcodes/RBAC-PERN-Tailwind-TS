import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return (
    knex.schema
      // 1. Roles Master Table
      .createTable("roles", (table) => {
        table.increments("id").primary();
        table.string("role_name").notNullable().unique();
      })
      // 2. Permissions Master Table
      .createTable("permissions", (table) => {
        table.increments("id").primary();
        table.string("permission_name").unique().notNullable();
      })
      // 3. Role-Permissions Security Bridge (Many-to-Many)
      .createTable("role_permissions", (table) => {
        table
          .integer("role_id")
          .unsigned()
          .references("id")
          .inTable("roles")
          .onDelete("CASCADE");
        table
          .integer("permission_id")
          .unsigned()
          .references("id")
          .inTable("permissions")
          .onDelete("CASCADE");
        table.primary(["role_id", "permission_id"]);
      })
      // 4. Users Profile Table
      .createTable("users", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("email").unique().notNullable();
        table.string("password_hash").notNullable();
        table
          .integer("role_id")
          .unsigned()
          .references("id")
          .inTable("roles")
          .onDelete("SET NULL");
      })
      // 5. Branches Table
      .createTable("branches", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("location").notNullable();
      })
      // 6. User-Branches Bridge Table (Many-to-Many)
      .createTable("user_branches", (table) => {
        table
          .integer("user_id")
          .unsigned()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table
          .integer("branch_id")
          .unsigned()
          .references("id")
          .inTable("branches")
          .onDelete("CASCADE");
        table.primary(["user_id", "branch_id"]);
      })
      // 7. Categories Tree Table
      .createTable("categories", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table
          .integer("parent_category_id")
          .unsigned()
          .references("id")
          .inTable("categories")
          .onDelete("CASCADE")
          .nullable();
        table
          .integer("branch_id")
          .unsigned()
          .references("id")
          .inTable("branches")
          .onDelete("CASCADE");
      })
      // 8. Products Master Table
      .createTable("products", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.text("description");
      })
      // 9. Product-Categories Bridge Table (Many-to-Many)
      .createTable("product_categories", (table) => {
        table
          .integer("product_id")
          .unsigned()
          .references("id")
          .inTable("products")
          .onDelete("CASCADE");
        table
          .integer("category_id")
          .unsigned()
          .references("id")
          .inTable("categories")
          .onDelete("CASCADE");
        table.primary(["product_id", "category_id"]);
      })
  );
}

export async function down(knex: Knex): Promise<void> {
  // Drops tables in dead reverse order to handle foreign-key constraints safely
  return knex.schema
    .dropTableIfExists("product_categories")
    .dropTableIfExists("products")
    .dropTableIfExists("categories")
    .dropTableIfExists("user_branches")
    .dropTableIfExists("branches")
    .dropTableIfExists("users")
    .dropTableIfExists("role_permissions")
    .dropTableIfExists("permissions")
    .dropTableIfExists("roles");
}
