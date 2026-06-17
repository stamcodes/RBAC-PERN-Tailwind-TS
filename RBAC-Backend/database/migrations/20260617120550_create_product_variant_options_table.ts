import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("product_variant_options", (table) => {
    table.increments("id").primary();
    table
      .integer("product_variant_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("product_variants")
      .onDelete("CASCADE");
    table
      .integer("variant_value_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("variant_values")
      .onDelete("CASCADE");
    table.unique(["product_variant_id", "variant_value_id"]);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("product_variant_options");
}
