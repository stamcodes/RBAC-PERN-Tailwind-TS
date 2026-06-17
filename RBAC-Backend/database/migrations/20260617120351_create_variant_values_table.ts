import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("variant_values", (table) => {
    table.increments("id").primary();
    table
      .integer("variant_type_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("variant_types")
      .onDelete("CASCADE");
    table.string("value_name", 100).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("variant_values");
}
