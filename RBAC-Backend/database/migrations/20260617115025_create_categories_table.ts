import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("categories", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable().unique();
    table.string("description", 255).nullable();
    table
      .integer("branch_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("branches")
      .onDelete("SET NULL");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("categories");
}
