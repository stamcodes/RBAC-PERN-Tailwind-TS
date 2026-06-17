import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("product_categories", (table) => {
    table.increments("id").primary();
    table
      .integer("product_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table
      .integer("category_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("categories")
      .onDelete("CASCADE");
    table.unique(["product_id", "category_id"]);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("product_categories");
}
