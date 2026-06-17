import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("product_variants", (table) => {
    table.increments("id").primary();
    table
      .integer("product_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table.string("sku", 100).notNullable().unique();
    table.decimal("price", 10, 2).notNullable();
    table.integer("stock_quantity").unsigned().notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("product_variants");
}
