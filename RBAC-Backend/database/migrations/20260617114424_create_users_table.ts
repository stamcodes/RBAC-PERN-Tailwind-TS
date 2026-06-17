import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table
      .integer("role_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("roles")
      .onDelete("RESTRICT");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
