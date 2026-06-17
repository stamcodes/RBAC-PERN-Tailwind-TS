import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("name", 150).notNullable();
    table.string("description", 500).nullable();
    table.decimal("price", 10, 2).notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("products");
}
