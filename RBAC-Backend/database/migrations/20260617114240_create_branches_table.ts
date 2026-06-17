import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("branches", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable().unique();
    table.string("location", 255).nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("branches");
}
