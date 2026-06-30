import { Knex } from "knex";
import bcrypt from "bcrypt";

export async function seed(knex: Knex): Promise<void> {
  await knex("users").del();

  const adminRole = await knex("roles").where({ name: "Admin" }).first();

  const password = await bcrypt.hash("Admin@1234", 10);

  await knex("users").insert([
    {
      name: "Super Admin",
      email: "admin@rbac.com",
      password,
      role_id: adminRole.id,
      is_active: true,
    },
  ]);
}
