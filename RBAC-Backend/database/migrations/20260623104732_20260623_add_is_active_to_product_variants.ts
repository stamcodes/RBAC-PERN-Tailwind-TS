import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("product_variants", (table) => {
    table.boolean("is_active").defaultTo(true).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("product_variants", (table) => {
    table.dropColumn("is_active");
  });
}
