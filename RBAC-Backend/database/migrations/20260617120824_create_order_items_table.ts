import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("order_items", (table) => {
    table.increments("id").primary();
    table
      .integer("order_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("orders")
      .onDelete("CASCADE");
    table
      .integer("product_variant_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("product_variants")
      .onDelete("RESTRICT");
    table.integer("quantity").unsigned().notNullable();
    table.decimal("price_at_purchase", 10, 2).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("order_items");
}
