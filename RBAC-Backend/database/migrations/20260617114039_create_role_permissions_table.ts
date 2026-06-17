import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("role_permissions", (table) => {
    table.increments("id").primary();
    table
      .integer("role_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
    table
      .integer("permission_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("permissions")
      .onDelete("CASCADE");
    table.unique(["role_id", "permission_id"]);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("role_permissions");
}
