import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("orders", (table) => {
    table.increments("id").primary();
    table
      .integer("branch_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("branches")
      .onDelete("RESTRICT");
    table
      .integer("created_by_user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");
    table.decimal("total_amount", 10, 2).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("orders");
}
