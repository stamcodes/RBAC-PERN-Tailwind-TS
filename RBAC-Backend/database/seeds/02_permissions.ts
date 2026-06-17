import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("role_permissions").del();
  await knex("permissions").del();

  await knex("permissions").insert([
    { name: "create_user", description: "Can create new users" },
    { name: "edit_user", description: "Can edit existing users" },
    { name: "delete_user", description: "Can delete users" },
    { name: "manage_roles", description: "Can assign and manage roles" },
    { name: "manage_permissions", description: "Can manage permissions" },
    { name: "manage_branches", description: "Can create and manage branches" },
    { name: "manage_products", description: "Can create and manage products" },
    { name: "manage_categories", description: "Can manage product categories" },
    { name: "manage_orders", description: "Can view and manage orders" },
    { name: "manage_inventory", description: "Can manage stock and variants" },
  ]);

  // Fetch admin role and all permissions
  const adminRole = await knex("roles").where({ name: "admin" }).first();
  const allPermissions = await knex("permissions").select("id");

  // Link all permissions to admin role
  const rolePermissions = allPermissions.map((permission: { id: number }) => ({
    role_id: adminRole.id,
    permission_id: permission.id,
  }));

  await knex("role_permissions").insert(rolePermissions);
}
