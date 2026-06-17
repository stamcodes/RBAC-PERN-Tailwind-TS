import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("roles").del();

  await knex("roles").insert([
    { name: "admin", description: "Super admin with full system access" },
    { name: "manager", description: "Branch level manager" },
    { name: "staff", description: "Regular staff member" },
  ]);
}
