import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("roles").del();

  await knex("roles").insert([
    { name: "Admin", description: "Super admin with full system access" },
    { name: "Manager", description: "Branch level manager" },
    { name: "Staff", description: "Regular staff member" },
  ]);
}
